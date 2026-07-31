import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(employeeId: string, deviceId: string, gpsLocation: string, faceMatchScore: number) {
    if (faceMatchScore < 85) {
      throw new BadRequestException('Face verification failed. Please try again.');
    }

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId }, include: { shift: true } });
    if (!employee) throw new BadRequestException('Employee not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await this.prisma.attendanceRecord.findFirst({
      where: { employeeId, date: today },
    });

    if (existingRecord) {
      throw new BadRequestException('Duplicate check-in for today is not allowed.');
    }

    const checkInTime = new Date();
    let penaltyDeductionMinutes = 0;

    if (employee.shift && employee.shift.startTime) {
      // Shift startTime is a Date object representing the time portion in UTC (1970-01-01)
      const shiftStart = new Date(checkInTime);
      shiftStart.setHours(
        employee.shift.startTime.getUTCHours(),
        employee.shift.startTime.getUTCMinutes(),
        0,
        0
      );

      const diffMs = checkInTime.getTime() - shiftStart.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes > 0) {
        // Parse penalty rules from DB, or use the default requirement
        const rules = (employee.shift.latePenaltyRules as any[]) || [
          { lateMinutes: 30, deductHours: 2 },
          { lateMinutes: 10, deductHours: 1 }
        ];

        // Sort rules descending by lateMinutes to apply the highest penalty first
        rules.sort((a, b) => b.lateMinutes - a.lateMinutes);

        for (const rule of rules) {
          if (diffMinutes >= rule.lateMinutes) {
            penaltyDeductionMinutes = rule.deductHours * 60;
            break;
          }
        }
      }
    }

    return this.prisma.attendanceRecord.create({
      data: {
        employeeId,
        shiftId: employee.shiftId,
        date: today,
        checkInTime,
        deviceId,
        gpsLocation,
        faceMatchScore,
        status: 'working',
        penaltyDeductionMinutes,
      },
    });
  }

  async startBreak(recordId: string) {
    const record = await this.prisma.attendanceRecord.findUnique({ where: { id: recordId } });
    if (!record || record.status !== 'working') throw new BadRequestException('Cannot start break right now');

    await this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: { status: 'on_break' },
    });

    return this.prisma.attendanceBreak.create({
      data: {
        attendanceRecordId: recordId,
        startTime: new Date(),
      },
    });
  }

  async resumeDuty(breakId: string, recordId: string) {
    await this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: { status: 'working' },
    });

    return this.prisma.attendanceBreak.update({
      where: { id: breakId },
      data: { endTime: new Date() },
    });
  }

  async checkOut(recordId: string) {
    const checkOutTime = new Date();
    
    // In a real scenario, this would calculate actual net working minutes and overtime
    return this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        checkOutTime,
        status: 'completed',
      },
    });
  }

  findAll() {
    return this.prisma.attendanceRecord.findMany({ include: { employee: true, shift: true, breaks: true } });
  }

  findOne(id: string) {
    return this.prisma.attendanceRecord.findUnique({ where: { id }, include: { employee: true, shift: true, breaks: true } });
  }
}
