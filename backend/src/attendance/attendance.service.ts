import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  extractFaceVectorFromBase64,
  euclideanDistance,
  cosineSimilarity,
  distanceToScore,
} from '../utils/serverFaceEngine';

type LatePenaltyRule = {
  lateMinutes: number;
  deductHours: number;
};

@Injectable()
export class AttendanceService {
  private cacheData: any = null;
  private cacheTimestamp = 0;
  private lastAutoCheck = 0;

  constructor(private prisma: PrismaService) {}

  private clearCache() {
    this.cacheData = null;
    this.cacheTimestamp = 0;
  }

  async autoCompleteExpiredShifts() {
    if (Date.now() - this.lastAutoCheck < 60000) return; // run every 60s
    this.lastAutoCheck = Date.now();
    try {
      const activeRecords = await this.prisma.attendanceRecord.findMany({
        where: { status: { in: ['working', 'on_break'] } },
        include: { shift: true, employee: { include: { shift: true } } },
      });

      const now = Date.now();
      for (const rec of activeRecords) {
        if (!rec.checkInTime) continue;
        const shift = rec.shift || rec.employee?.shift;
        const requiredHours = shift && shift.requiredHours ? Number(shift.requiredHours) : 9;
        const requiredMs = requiredHours * 3600000;
        const autoCutoffMs = 2 * 3600000; // 2 hours grace period after shift end!
        const checkInMs = new Date(rec.checkInTime).getTime();
        const elapsedMs = now - checkInMs;

        let shouldComplete = elapsedMs >= (requiredMs + autoCutoffMs);

        // Also check if shift endTime + 2 hours has passed
        if (shift && shift.endTime && !shouldComplete) {
          const shiftEnd = new Date(rec.checkInTime);
          const utcH = shift.endTime.getUTCHours();
          const utcM = shift.endTime.getUTCMinutes();
          shiftEnd.setHours(utcH, utcM, 0, 0);
          if (shiftEnd.getTime() < checkInMs) {
            shiftEnd.setDate(shiftEnd.getDate() + 1);
          }
          const cutOffTime = shiftEnd.getTime() + autoCutoffMs;
          if (now >= cutOffTime) {
            shouldComplete = true;
          }
        }

        if (shouldComplete) {
          const autoCheckOutTime = new Date();
          // Capped at shift requiredMinutes (overtime beyond shift is unpayable)
          const payableRegularMinutes = requiredHours * 60;
          const penaltyMins = rec.penaltyDeductionMinutes || 0;
          const netWorkingMinutes = Math.max(0, payableRegularMinutes - penaltyMins);

          await this.prisma.attendanceRecord.update({
            where: { id: rec.id },
            data: {
              status: 'completed',
              checkOutTime: autoCheckOutTime,
              regularMinutes: payableRegularMinutes,
              overtimeMinutes: 0,
              netWorkingMinutes,
            },
          });
          console.log(`[AutoEnd] Auto-completed duty for employee ${rec.employeeId} (2h after shift end). Overtime = 0.`);
          this.clearCache();
        }
      }
    } catch (err) {
      console.error('Failed in autoCompleteExpiredShifts:', err);
    }
  }


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

    let shiftStartHour = 8;
    let shiftStartMinute = 0;

    if (employee.shift && employee.shift.startTime) {
      const st = employee.shift.startTime;
      if (typeof st === 'string') {
        const parts = (st as string).includes('T')
          ? (st as string).split('T')[1]?.split(':') || []
          : (st as string).split(':');
        shiftStartHour = parseInt(parts[0] || '8', 10);
        shiftStartMinute = parseInt(parts[1] || '0', 10);
      } else if (st instanceof Date && !isNaN(st.getTime())) {
        shiftStartHour = st.getUTCHours();
        shiftStartMinute = st.getUTCMinutes();
      }
    }

    const shiftStart = new Date(checkInTime);
    shiftStart.setHours(shiftStartHour, shiftStartMinute, 0, 0);

    const diffMs = checkInTime.getTime() - shiftStart.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes > 0) {
      // Late Penalty Rules: 10 mins late -> 1 hr salary penalty, 30 mins late -> 2 hrs salary penalty
      if (diffMinutes >= 30) {
        penaltyDeductionMinutes = 120; // 2 hours penalty
      } else if (diffMinutes >= 10) {
        penaltyDeductionMinutes = 60; // 1 hour penalty
      }
    }

    const newRec = await this.prisma.attendanceRecord.create({
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
    this.clearCache();
    return newRec;
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

    const res = await this.prisma.attendanceBreak.create({
      data: {
        attendanceRecordId: recordId,
        startTime: new Date(),
      },
    });
    this.clearCache();
    return res;
  }

  async resumeDuty(breakId: string, recordId: string) {
    await this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: { status: 'working' },
    });

    const res = await this.prisma.attendanceBreak.update({
      where: { id: breakId },
      data: { endTime: new Date() },
    });
    this.clearCache();
    return res;
  }

  async checkOut(recordId: string, checkOutPhotoUrl?: string) {
    const checkOutTime = new Date();

    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: { employee: { include: { shift: true } }, shift: true, breaks: true },
    });
    if (!record) throw new BadRequestException('Attendance record not found');

    const checkInMs = record.checkInTime ? record.checkInTime.getTime() : checkOutTime.getTime();
    const grossMs = checkOutTime.getTime() - checkInMs;
    const grossMinutes = Math.max(0, Math.floor(grossMs / 60000));
    const penaltyMins = record.penaltyDeductionMinutes || 0;

    const shiftObj = record.shift || record.employee?.shift;
    const requiredHours = shiftObj && shiftObj.requiredHours ? Number(shiftObj.requiredHours) : 9;
    const maxPayableRegularMinutes = requiredHours * 60;

    // Overtime is NOT payable: Regular minutes capped at shift required minutes!
    const payableRegularMinutes = Math.min(grossMinutes, maxPayableRegularMinutes);

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
      payableRegularMinutes - breakMinutes - penaltyMins,
    );

    const updatedRec = await this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        checkOutTime,
        status: 'completed',
        regularMinutes: payableRegularMinutes,
        overtimeMinutes: 0,
        breakMinutes,
        netWorkingMinutes,
        ...(checkOutPhotoUrl ? { checkOutPhotoUrl } : {}),
      },
    });
    this.clearCache();
    return updatedRec;
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

  async findAll() {
    if (this.cacheData && Date.now() - this.cacheTimestamp < 8000) {
      return this.cacheData;
    }
    await this.autoCompleteExpiredShifts();

    const records = await this.prisma.attendanceRecord.findMany({
      select: {
        id: true,
        employeeId: true,
        shiftId: true,
        date: true,
        checkInTime: true,
        checkOutTime: true,
        netWorkingMinutes: true,
        breakMinutes: true,
        regularMinutes: true,
        overtimeMinutes: true,
        penaltyDeductionMinutes: true,
        faceMatchScore: true,
        livenessPassed: true,
        status: true,
        deviceId: true,
        gpsLocation: true,
        createdAt: true,
        employee: {
          include: {
            role: true,
            department: true,
            shift: true,
          },
        },
        shift: true,
        breaks: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    this.cacheData = records;
    this.cacheTimestamp = Date.now();
    return records;
  }

  findOne(id: string) {
    return this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: { employee: true, shift: true, breaks: true },
    });
  }

  async verifyFace(employeeId: string, livePhotoBase64?: string, liveVectorInput?: number[]) {
    if (!employeeId) {
      throw new BadRequestException('Employee ID is required');
    }
    if (!livePhotoBase64 && (!liveVectorInput || !Array.isArray(liveVectorInput))) {
      throw new BadRequestException('Either livePhotoBase64 or liveVector array is required');
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
      } else if (ef.imageUrl) {
        try {
          const vec = await extractFaceVectorFromBase64(ef.imageUrl);
          if (vec && vec.length === 128) {
            storedEmbeddings.push(vec);
            angles.push(ef.angle || 'Front View');
            // Backfill database asynchronously so future attendance checks are instant
            this.prisma.employeeFace.update({
              where: { id: ef.id },
              data: { faceEmbedding: vec },
            }).catch((e) => console.warn('Failed async faceEmbedding backfill:', e));
          }
        } catch (e) {
          console.warn('Failed on-the-fly vector extraction for face record:', ef.id, e);
        }
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

    let liveVector: number[] | null = null;
    if (Array.isArray(liveVectorInput) && liveVectorInput.length === 128) {
      liveVector = liveVectorInput;
    } else if (livePhotoBase64) {
      liveVector = await extractFaceVectorFromBase64(livePhotoBase64);
    }

    if (!liveVector) {
      return {
        success: false,
        reason: 'no_face',
        score: 0,
        bestAngle: 'No clean face detected in live submission',
      };
    }

    let maxSimilarity = 0;
    let bestAngle = 'None';

    for (let i = 0; i < storedEmbeddings.length; i++) {
      const sim = cosineSimilarity(liveVector, storedEmbeddings[i]);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        bestAngle = angles[i];
      }
    }

    const score = Math.round(maxSimilarity * 100);
    const passed = score >= 82;

    return {
      success: passed,
      reason: passed ? 'none' : 'mismatch',
      score,
      bestAngle: `${bestAngle} (${score}% match)`,
      distance: 1 - maxSimilarity,
    };
  }
}
