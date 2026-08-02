import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  extractFaceVectorFromBase64,
  euclideanDistance,
  distanceToScore,
} from '../utils/serverFaceEngine';

type LatePenaltyRule = {
  lateMinutes: number;
  deductHours: number;
};

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(
    employeeId: string,
    deviceId: string,
    gpsLocation: string,
    faceMatchScore: number,
    photoUrl?: string,
    livenessPassed: boolean = true,
    isManualOverride: boolean = false,
  ) {
    if (!isManualOverride && faceMatchScore >= 0 && faceMatchScore < 60) {
      throw new BadRequestException(
        'Face verification failed. Score below required 60% threshold.',
      );
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { shift: true },
    });
    if (!employee) throw new BadRequestException('Employee not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingActiveRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        status: { in: ['working', 'on_break'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingActiveRecord) {
      // Do not overwrite checkInTime or destroy previous sessions!
      // Return existing active session cleanly.
      return existingActiveRecord;
    }

    const checkInTime = new Date();
    let penaltyDeductionMinutes = 0;

    if (employee.shift && employee.shift.startTime) {
      const shiftStart = new Date(checkInTime);
      shiftStart.setHours(
        employee.shift.startTime.getUTCHours(),
        employee.shift.startTime.getUTCMinutes(),
        0,
        0,
      );

      const diffMs = checkInTime.getTime() - shiftStart.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes > 0) {
        // Late Penalty Rules: 10 mins late -> 1 hr salary, 30 mins late -> 2 hrs salary
        if (diffMinutes >= 30) {
          penaltyDeductionMinutes = 120; // 2 hours
        } else if (diffMinutes >= 10) {
          penaltyDeductionMinutes = 60; // 1 hour
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
        faceMatchScore: isManualOverride ? -1 : faceMatchScore,
        photoUrl: photoUrl || null,
        livenessPassed: isManualOverride ? false : (livenessPassed ?? true),
        status: 'working',
        penaltyDeductionMinutes,
      },
    });
  }

  async startBreak(recordId: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
    });
    if (!record || record.status !== 'working')
      throw new BadRequestException('Cannot start break right now');

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

    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: { employee: true, breaks: true },
    });
    if (!record) throw new BadRequestException('Attendance record not found');

    const checkInMs = record.checkInTime ? record.checkInTime.getTime() : checkOutTime.getTime();
    const grossMs = checkOutTime.getTime() - checkInMs;
    const grossMinutes = Math.max(0, Math.floor(grossMs / 60000));
    const penaltyMins = record.penaltyDeductionMinutes || 0;

    // Calculate total break duration
    let breakMinutes = 0;
    for (const b of record.breaks) {
      if (b.endTime) {
        breakMinutes += Math.floor(
          (b.endTime.getTime() - b.startTime.getTime()) / 60000,
        );
      }
    }

    const netWorkingMinutes = Math.max(
      0,
      grossMinutes - breakMinutes - penaltyMins,
    );
    const workedHours = Math.round((netWorkingMinutes / 60) * 100) / 100;

    // Salary Math: e.g. Base ₹15,000 / 30 = ₹500/day -> ₹500 / 24 = ₹20.833/hr
    const monthlySalary = (record.employee?.salaryRate ? Number(record.employee.salaryRate) : 0) || 15000;
    const dailyRate = monthlySalary / 30;
    const hourlyRate = dailyRate / 24;

    const penaltyMoneyDeduction = (penaltyMins / 60) * hourlyRate;
    const grossEarnedMoney = (grossMinutes / 60) * hourlyRate;
    const netEarnedMoney = Math.max(
      0,
      Math.round((grossEarnedMoney - penaltyMoneyDeduction) * 100) / 100,
    );

    return this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        checkOutTime,
        status: 'completed',
        regularMinutes: grossMinutes,
        breakMinutes,
        netWorkingMinutes,
      },
    });
  }

  async getEmployeeHeatmap(employeeId: string, monthStr?: string) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { employeeId },
      orderBy: { date: 'asc' },
    });

    const heatmapData = records.map((rec) => {
      let durationHours = 0;
      if (rec.checkOutTime && rec.checkInTime) {
        const ms = rec.checkOutTime.getTime() - rec.checkInTime.getTime();
        durationHours = Math.round((ms / 3600000) * 100) / 100;
      }

      return {
        date: rec.date.toISOString().split('T')[0],
        hoursWorked: durationHours,
        status: rec.status,
        penaltyMinutes: rec.penaltyDeductionMinutes || 0,
        faceMatchScore: rec.faceMatchScore,
      };
    });

    return heatmapData;
  }

  findAll() {
    return this.prisma.attendanceRecord.findMany({
      include: { employee: true, shift: true, breaks: true },
    });
  }

  findOne(id: string) {
    return this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: { employee: true, shift: true, breaks: true },
    });
  }

  async verifyFace(employeeId: string, livePhotoBase64: string) {
    if (!employeeId || !livePhotoBase64) {
      throw new BadRequestException('Employee ID and live capture photo are required');
    }

    const employeeFaces = await this.prisma.employeeFace.findMany({
      where: { employeeId },
    });

    if (!employeeFaces || employeeFaces.length === 0) {
      return {
        success: false,
        reason: 'no_registered_faces',
        score: 0,
        bestAngle: 'No faces registered in database',
      };
    }

    const storedEmbeddings: number[][] = [];
    const angles: string[] = [];

    for (const ef of employeeFaces) {
      if (Array.isArray(ef.faceEmbedding) && ef.faceEmbedding.length === 128) {
        storedEmbeddings.push(ef.faceEmbedding as number[]);
        angles.push(ef.angle || 'Front View');
      }
    }

    if (storedEmbeddings.length === 0) {
      return {
        success: false,
        reason: 'old_embeddings',
        score: 0,
        bestAngle: 'Re-registration required (old format)',
      };
    }

    // Extract 128D vector from live captured camera image
    const liveVector = await extractFaceVectorFromBase64(livePhotoBase64);
    if (!liveVector) {
      return {
        success: false,
        reason: 'no_face',
        score: 0,
        bestAngle: 'No clean face detected in live photo',
      };
    }

    let minDistance = Infinity;
    let bestAngle = 'None';

    for (let i = 0; i < storedEmbeddings.length; i++) {
      const dist = euclideanDistance(liveVector, storedEmbeddings[i]);
      if (dist < minDistance) {
        minDistance = dist;
        bestAngle = angles[i];
      }
    }

    const score = distanceToScore(minDistance);
    const passed = score >= 75 && minDistance <= 0.50;

    return {
      success: passed,
      reason: passed ? 'none' : 'mismatch',
      score,
      bestAngle: `${bestAngle} (${Math.round(minDistance * 100) / 100} dist)`,
      distance: minDistance,
    };
  }
}
