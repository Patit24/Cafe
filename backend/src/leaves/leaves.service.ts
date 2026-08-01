import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto, UpdateLeaveDto } from './dto/create-leave.dto';

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLeaveDto: CreateLeaveDto) {
    return this.prisma.leaveApplication.create({
      data: {
        employeeId: createLeaveDto.employeeId,
        startDate: new Date(createLeaveDto.startDate),
        endDate: new Date(createLeaveDto.endDate),
        reason: createLeaveDto.reason,
        type: createLeaveDto.type,
      },
      include: { employee: true },
    });
  }

  async findAll() {
    return this.prisma.leaveApplication.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const leave = await this.prisma.leaveApplication.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!leave) throw new NotFoundException('Leave not found');
    return leave;
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto) {
    return this.prisma.leaveApplication.update({
      where: { id },
      data: updateLeaveDto.status ? { status: updateLeaveDto.status } : {},
      include: { employee: true },
    });
  }

  async remove(id: string) {
    return this.prisma.leaveApplication.delete({
      where: { id },
    });
  }
}
