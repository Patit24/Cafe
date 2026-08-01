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

  create(createEmployeeDto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: createEmployeeDto,
    });
  }

  findAll() {
    return this.prisma.employee.findMany({
      include: { department: true, role: true, shift: true, faces: true },
    });
  }

  findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, role: true, shift: true, faces: true },
    });
  }

  update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id },
      data: updateEmployeeDto,
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
