import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async generatePayroll(employeeId: string, periodStart: Date, periodEnd: Date) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new BadRequestException('Employee not found');

    const attendances = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
        status: 'completed',
      },
    });

    let totalWorkingHours = 0;
    let totalOvertimeHours = 0;
    let totalPenaltyMinutes = 0;

    attendances.forEach((record) => {
      totalWorkingHours += (record.regularMinutes || 0) / 60;
      totalOvertimeHours += (record.overtimeMinutes || 0) / 60;
      totalPenaltyMinutes += record.penaltyDeductionMinutes || 0;
    });

    let baseSalary = 0;
    let overtimePay = 0;
    let penaltyDeductions = 0;
    let unauthorizedAbsenceDeductions = 0;

    // Fetch leaves for this period
    const leaves = await this.prisma.leaveApplication.findMany({
      where: {
        employeeId,
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
    });

    // Check for unauthorized absences
    // For simplicity, assuming everyday from periodStart to periodEnd is a potential working day
    let unauthorizedAbsenceDays = 0;
    const current = new Date(periodStart);
    while (current <= periodEnd) {
      const isWeekend = current.getDay() === 0 || current.getDay() === 6; // Skip weekends if needed, or don't. The user didn't specify, so let's skip weekends. Wait, I told the user I'd assume 30 days unless specified. The user approved. Let's assume everyday is a working day, but commonly weekends are off. Let's just assume all days are expected for now, or just calculate based on total days in period. Actually, the user approved "assume a 30-day continuous working month".
      
      const dateStr = current.toISOString().split('T')[0];
      const hasAttendance = attendances.some(a => a.date.toISOString().split('T')[0] === dateStr);
      
      let hasLeave = false;
      let isPaidLeave = false;
      for (const leave of leaves) {
        if (current >= leave.startDate && current <= leave.endDate) {
          hasLeave = true;
          if (leave.type === 'paid') {
            isPaidLeave = true;
          }
          break;
        }
      }

      if (!hasAttendance && !hasLeave) {
        unauthorizedAbsenceDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    if (employee.salaryType === 'hourly') {
      baseSalary = totalWorkingHours * Number(employee.salaryRate);
      overtimePay = totalOvertimeHours * Number(employee.overtimeRate);
      penaltyDeductions = (totalPenaltyMinutes / 60) * Number(employee.salaryRate);
      unauthorizedAbsenceDeductions = 0; // Hourly employees don't get deducted for not working, they just don't get paid.
    } else if (employee.salaryType === 'daily') {
      const daysWorked = attendances.length;
      baseSalary = daysWorked * Number(employee.salaryRate);
      
      // Add paid leaves to base salary
      const paidLeaveDays = leaves.reduce((total, leave) => {
        if (leave.type === 'paid') {
          // Calculate overlap
          const start = new Date(Math.max(leave.startDate.getTime(), periodStart.getTime()));
          const end = new Date(Math.min(leave.endDate.getTime(), periodEnd.getTime()));
          const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return total + (days > 0 ? days : 0);
        }
        return total;
      }, 0);
      baseSalary += paidLeaveDays * Number(employee.salaryRate);
      
      overtimePay = totalOvertimeHours * Number(employee.overtimeRate);
      const hourlyEquivalent = Number(employee.salaryRate) / 8;
      penaltyDeductions = (totalPenaltyMinutes / 60) * hourlyEquivalent;
      unauthorizedAbsenceDeductions = 0; // Daily employees just don't earn for absences.
    } else if (employee.salaryType === 'monthly') {
      baseSalary = Number(employee.salaryRate);
      overtimePay = totalOvertimeHours * Number(employee.overtimeRate);
      const hourlyEquivalent = Number(employee.salaryRate) / 240;
      penaltyDeductions = (totalPenaltyMinutes / 60) * hourlyEquivalent;
      
      const dailyEquivalent = Number(employee.salaryRate) / 30; // Assuming 30 days
      unauthorizedAbsenceDeductions = unauthorizedAbsenceDays * dailyEquivalent;
    }

    const netSalary = baseSalary + overtimePay - penaltyDeductions - unauthorizedAbsenceDeductions;

    return this.prisma.payrollEntry.create({
      data: {
        employeeId,
        periodStart,
        periodEnd,
        totalWorkingHours,
        totalOvertimeHours,
        baseSalary,
        overtimePay,
        penaltyDeductions: penaltyDeductions + unauthorizedAbsenceDeductions, // Storing together for simplicity, or we can add a new field. Let's just add it to penaltyDeductions.
        netSalary,
        status: 'generated',
      },
    });
  }

  async updateStatus(id: string, status: any) {
    return this.prisma.payrollEntry.update({
      where: { id },
      data: { status },
    });
  }

  findAll() {
    return this.prisma.payrollEntry.findMany({ include: { employee: true } });
  }

  findOne(id: string) {
    return this.prisma.payrollEntry.findUnique({ where: { id }, include: { employee: true } });
  }
}
