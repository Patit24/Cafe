import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  create(createEmployeeDto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: createEmployeeDto as any,
    });
  }

  findAll() {
    return this.prisma.employee.findMany({
      include: { department: true, role: true, shift: true },
    });
  }

  findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, role: true, shift: true },
    });
  }

  update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id },
      data: updateEmployeeDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.employee.delete({
      where: { id },
    });
  }

  addFace(employeeId: string, faceData: any) {
    return this.prisma.employeeFace.create({
      data: {
        employeeId,
        imageUrl: faceData.imageUrl,
        angle: faceData.angle,
        faceEmbedding: faceData.faceEmbedding || null,
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
