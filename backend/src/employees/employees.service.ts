import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from '../prisma/prisma.service';

export type EmployeeFacePayload = {
  imageUrl?: string;
  angle?: string;
  faceEmbedding?: number[];
};

@Injectable()
export class EmployeesService {
  private cacheData: any = null;
  private cacheTimestamp = 0;

  constructor(private prisma: PrismaService) {}

  private clearCache() {
    this.cacheData = null;
    this.cacheTimestamp = 0;
  }

  private async getOrCreateShift(dutyStartTime?: string, dutyEndTime?: string, shiftId?: string): Promise<string | null> {
    if (shiftId && !dutyStartTime && !dutyEndTime) return shiftId;
    if (!dutyStartTime || !dutyEndTime) {
      dutyStartTime = '08:00';
      dutyEndTime = '17:00';
    }

    // Clean HH:MM string format
    const cleanStart = dutyStartTime.trim().substring(0, 5);
    const cleanEnd = dutyEndTime.trim().substring(0, 5);

    const startTime = new Date(`1970-01-01T${cleanStart}:00.000Z`);
    const endTime = new Date(`1970-01-01T${cleanEnd}:00.000Z`);

    let requiredHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (requiredHours <= 0) requiredHours += 24;

    let shift = await this.prisma.shiftTemplate.findFirst({
      where: {
        startTime: { equals: startTime },
        endTime: { equals: endTime },
      },
    });

    if (!shift) {
      shift = await this.prisma.shiftTemplate.create({
        data: {
          name: `${cleanStart} - ${cleanEnd}`,
          startTime,
          endTime,
          requiredHours: Math.round(requiredHours * 100) / 100,
        },
      });
    }

    return shift.id;
  }

  async create(createEmployeeDto: any) {
    const { role, dutyStartTime, dutyEndTime, shiftId, ...dtoData } = createEmployeeDto;
    let roleId = dtoData.roleId;

    if (!roleId) {
      const targetRole = (role && typeof role === 'string' && role.trim()) ? role.trim() : 'Kitchen Staff';
      let r = await this.prisma.role.findFirst({
        where: { name: { equals: targetRole, mode: 'insensitive' } },
      });
      if (!r) {
        r = await this.prisma.role.create({ data: { name: targetRole } });
      }
      roleId = r.id;
    }

    const assignedShiftId = await this.getOrCreateShift(dutyStartTime, dutyEndTime, shiftId);

    const res = await this.prisma.employee.create({
      data: {
        ...dtoData,
        roleId,
        ...(assignedShiftId ? { shiftId: assignedShiftId } : {}),
      },
      include: { role: true, department: true, shift: true, faces: true },
    });
    this.clearCache();
    return res;
  }

  async findAll() {
    this.clearCache();
    const results = await this.prisma.employee.findMany({
      include: {
        department: true,
        role: true,
        shift: true,
        faces: {
          select: {
            id: true,
            angle: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return results;
  }

  findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, role: true, shift: true, faces: true },
    });
  }

  async update(id: string, updateEmployeeDto: any) {
    const { role, dutyStartTime, dutyEndTime, shiftId, ...dtoData } = updateEmployeeDto;
    let roleId = dtoData.roleId;

    if (role !== undefined) {
      const targetRole = (role && typeof role === 'string' && role.trim()) ? role.trim() : 'Kitchen Staff';
      let r = await this.prisma.role.findFirst({
        where: { name: { equals: targetRole, mode: 'insensitive' } },
      });
      if (!r) {
        r = await this.prisma.role.create({ data: { name: targetRole } });
      }
      roleId = r.id;
    }

    let assignedShiftId: string | null | undefined = undefined;
    if (dutyStartTime && dutyEndTime) {
      assignedShiftId = await this.getOrCreateShift(dutyStartTime, dutyEndTime, undefined);
    } else if (shiftId) {
      assignedShiftId = shiftId;
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        ...dtoData,
        ...(roleId !== undefined ? { roleId } : {}),
        ...(assignedShiftId !== undefined ? { shiftId: assignedShiftId } : {}),
      },
      include: { role: true, department: true, shift: true, faces: true },
    });
    this.clearCache();
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.prisma.employee.delete({
      where: { id },
    });
    this.clearCache();
    return deleted;
  }

  async addFace(employeeId: string, faceData: EmployeeFacePayload) {
    const added = await this.prisma.employeeFace.create({
      data: {
        employeeId,
        imageUrl: faceData.imageUrl,
        angle: faceData.angle,
        faceEmbedding: faceData.faceEmbedding ?? Prisma.JsonNull,
      },
    });
    this.clearCache();
    return added;
  }

  getFaces(employeeId: string) {
    return this.prisma.employeeFace.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeFace(faceId: string) {
    const removed = await this.prisma.employeeFace.delete({
      where: { id: faceId },
    });
    this.clearCache();
    return removed;
  }
}
