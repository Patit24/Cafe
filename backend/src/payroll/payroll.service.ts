import { Injectable, BadRequestException } from '@nestjs/common';
import { PayrollStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  private cacheData: any = null;
  private cacheTimestamp = 0;
  private lastAutoRecalc = 0;

  constructor(private prisma: PrismaService) {}

  private clearCache() {
    this.cacheData = null;
    this.cacheTimestamp = 0;
  }

  async generatePayroll(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new BadRequestException('Employee not found');

    const attendances = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    let totalWorkedMinutes = 0;
    let totalOvertimeHours = 0;
    let totalPenaltyMinutes = 0;

    attendances.forEach((record) => {
      totalPenaltyMinutes += (record.penaltyDeductionMinutes || 0);
      totalOvertimeHours += (record.overtimeMinutes || 0) / 60;
      if (record.checkOutTime && record.checkInTime) {
        const ms = new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime();
        totalWorkedMinutes += Math.max(0, Math.floor(ms / 60000));
      } else if (record.status === 'working' && record.checkInTime) {
        const ms = Date.now() - new Date(record.checkInTime).getTime();
        totalWorkedMinutes += Math.max(0, Math.floor(ms / 60000));
      } else if (record.regularMinutes && record.regularMinutes > 0) {
        totalWorkedMinutes += record.regularMinutes;
      }
    });

    const totalWorkingHours = totalWorkedMinutes / 60;

    let baseSalary = 0;
    let overtimePay = 0;
    let penaltyDeductions = 0;

    const salaryRateNum = Number(employee.salaryRate || 0);
    const overtimeRateNum = Number(employee.overtimeRate || 0);

    if (employee.salaryType === 'hourly') {
      const hourlyRate = salaryRateNum > 0 ? salaryRateNum : 100;
      baseSalary = totalWorkingHours * hourlyRate;
      overtimePay = totalOvertimeHours * (overtimeRateNum || hourlyRate * 1.5);
      penaltyDeductions = (totalPenaltyMinutes / 60) * hourlyRate;
    } else if (employee.salaryType === 'daily') {
      const dailyRate = salaryRateNum > 0 ? salaryRateNum : 500;
      const hourlyRate = dailyRate / 9; // Standard 9-hour shift
      const daysWorked = attendances.length || (totalWorkingHours > 0 ? 1 : 0);
      baseSalary = daysWorked * dailyRate;
      overtimePay = totalOvertimeHours * (overtimeRateNum || hourlyRate * 1.5);
      penaltyDeductions = (totalPenaltyMinutes / 60) * hourlyRate;
    } else {
      // Monthly fixed salary (e.g. ₹120,000, ₹30,000, ₹20,000, ₹15,000)
      const monthlySalary = salaryRateNum > 0 ? salaryRateNum : 15000;
      const dailyRate = monthlySalary / 30;
      const hourlyRate = dailyRate / 9; // Standard 9-hour shift

      baseSalary = monthlySalary;
      overtimePay = totalOvertimeHours * (overtimeRateNum || hourlyRate * 1.5);
      penaltyDeductions = (totalPenaltyMinutes / 60) * hourlyRate;
    }

    // Round to 2 decimal places
    baseSalary = Math.round(baseSalary * 100) / 100;
    overtimePay = Math.round(overtimePay * 100) / 100;
    penaltyDeductions = Math.round(penaltyDeductions * 100) / 100;

    const netSalary = Math.max(0, Math.round((baseSalary + overtimePay - penaltyDeductions) * 100) / 100);

    // Check if there is an existing pending (generated) payroll record for this employee
    const existingEntry = await this.prisma.payrollEntry.findFirst({
      where: {
        employeeId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingEntry) {
      return this.prisma.payrollEntry.update({
        where: { id: existingEntry.id },
        data: {
          periodStart,
          periodEnd,
          totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
          totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
          baseSalary,
          overtimePay,
          penaltyDeductions,
          netSalary,
        },
      });
    }

    return this.prisma.payrollEntry.create({
      data: {
        employeeId,
        periodStart,
        periodEnd,
        totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        baseSalary,
        overtimePay,
        penaltyDeductions,
        netSalary,
        status: 'generated',
      },
    });
  }

  async generateAll() {
    const activeEmployees = await this.prisma.employee.findMany({
      where: { isActive: true },
    });
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (const emp of activeEmployees) {
      try {
        await this.generatePayroll(emp.id, firstDayOfMonth, lastDayOfMonth);
      } catch (err) {
        console.error(`Failed to generate payroll for ${emp.id}`, err);
      }
    }
    this.clearCache();
    this.lastAutoRecalc = Date.now();
    return this.findAll();
  }

  async updateStatus(id: string, status: PayrollStatus) {
    const res = await this.prisma.payrollEntry.update({
      where: { id },
      data: { status },
    });
    this.clearCache();
    return res;
  }

  async findAll() {
    if (this.cacheData && Date.now() - this.cacheTimestamp < 15000) {
      return this.cacheData;
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const activeEmployees = await this.prisma.employee.findMany({
      where: { isActive: true },
    });
    for (const emp of activeEmployees) {
      try {
        await this.generatePayroll(emp.id, firstDayOfMonth, lastDayOfMonth);
      } catch (err) {
        console.error(`Failed to auto-generate payroll for ${emp.id}`, err);
      }
    }

    const results = await this.prisma.payrollEntry.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });

    // Deduplicate results by employeeId to return 1 active record per employee
    const seen = new Set<string>();
    const deduplicatedResults: any[] = [];
    results.forEach((rec) => {
      const empId = rec.employeeId || rec.employee?.id;
      if (empId && !seen.has(empId)) {
        seen.add(empId);
        deduplicatedResults.push(rec);
      }
    });

    this.cacheData = deduplicatedResults;
    this.cacheTimestamp = Date.now();
    return deduplicatedResults;
  }

  findOne(id: string) {
    return this.prisma.payrollEntry.findUnique({
      where: { id },
      include: { employee: true },
    });
  }
}
