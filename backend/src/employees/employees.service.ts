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
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.employee.create({
      data: {
        ...dtoData,
        roleId,
      },
      include: { role: true, department: true, shift: true, faces: true },
    });
  }

  findAll() {
    return this.prisma.employee.findMany({
      include: { department: true, role: true, shift: true, faces: true },
      orderBy: { createdAt: 'desc' },
    });
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

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dtoData,
        ...(roleId !== undefined ? { roleId } : {}),
      },
      include: { role: true, department: true, shift: true, faces: true },
    });
  }

  remove(id: string) {
    return this.prisma.employee.delete({
      where: { id },
    });
  }

  addFace(employeeId: string, faceData: EmployeeFacePayload) {
    return this.prisma.employeeFace.create({
      data: {
        employeeId,
        imageUrl: faceData.imageUrl,
        angle: faceData.angle,
        faceEmbedding: faceData.faceEmbedding ?? Prisma.JsonNull,
      },
    });
  }

  getFaces(employeeId: string) {
    return this.prisma.employeeFace.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  removeFace(faceId: string) {
    return this.prisma.employeeFace.delete({
      where: { id: faceId },
    });
  }
}
