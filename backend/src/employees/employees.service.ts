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

  async create(createEmployeeDto: any) {
    const { role, ...dtoData } = createEmployeeDto;
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

    const res = await this.prisma.employee.create({
      data: {
        ...dtoData,
        roleId,
      },
      include: { role: true, department: true, shift: true, faces: true },
    });
    this.clearCache();
    return res;
  }

  async findAll() {
    if (this.cacheData && Date.now() - this.cacheTimestamp < 10000) {
      return this.cacheData;
    }
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
    this.cacheData = results;
    this.cacheTimestamp = Date.now();
    return results;
  }

  findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, role: true, shift: true, faces: true },
    });
  }

  async update(id: string, updateEmployeeDto: any) {
    const { role, ...dtoData } = updateEmployeeDto;
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

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        ...dtoData,
        ...(roleId !== undefined ? { roleId } : {}),
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
