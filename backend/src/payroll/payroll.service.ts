import { Injectable, BadRequestException } from '@nestjs/common';
import { PayrollStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

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
      baseSalary = totalWorkingHours * salaryRateNum;
      overtimePay = totalOvertimeHours * overtimeRateNum;
      penaltyDeductions = (totalPenaltyMinutes / 60) * salaryRateNum;
    } else if (employee.salaryType === 'daily') {
      const daysWorked = attendances.length || 1;
      baseSalary = daysWorked * salaryRateNum;
      overtimePay = totalOvertimeHours * overtimeRateNum;
      const hourlyEquivalent = salaryRateNum / 24;
      penaltyDeductions = (totalPenaltyMinutes / 60) * hourlyEquivalent;
    } else {
      // Monthly salary rate is base salary
      baseSalary = salaryRateNum;
      overtimePay = totalOvertimeHours * overtimeRateNum;
      const dailyRate = salaryRateNum / 30;
      const hourlyEquivalent = dailyRate / 24;
      penaltyDeductions = (totalPenaltyMinutes / 60) * hourlyEquivalent;
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
        status: 'generated',
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
    return this.findAll();
  }

  async updateStatus(id: string, status: PayrollStatus) {
    return this.prisma.payrollEntry.update({
      where: { id },
      data: { status },
    });
  }

  async findAll() {
    const activeEmployees = await this.prisma.employee.findMany({
      where: { isActive: true },
    });
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (const emp of activeEmployees) {
      const existing = await this.prisma.payrollEntry.findFirst({
        where: { employeeId: emp.id },
      });
      if (!existing || existing.status === 'generated') {
        try {
          await this.generatePayroll(emp.id, firstDayOfMonth, lastDayOfMonth);
        } catch (err) {
          console.error(`Failed to auto-generate payroll for ${emp.id}`, err);
        }
      }
    }

    return this.prisma.payrollEntry.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.payrollEntry.findUnique({
      where: { id },
      include: { employee: true },
    });
  }
}
