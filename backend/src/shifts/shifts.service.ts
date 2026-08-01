import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createShiftDto: CreateShiftDto) {
    return this.prisma.shiftTemplate.create({
      data: {
        name: createShiftDto.name,
        startTime: this.timeToDate(createShiftDto.startTime),
        endTime: this.timeToDate(createShiftDto.endTime),
        requiredHours: createShiftDto.requiredHours,
        maxBreakHours: createShiftDto.maxBreakHours,
        ...(createShiftDto.latePenaltyRules !== undefined && {
          latePenaltyRules:
            createShiftDto.latePenaltyRules as unknown as Prisma.InputJsonValue,
        }),
      },
    });
  }

  findAll() {
    return this.prisma.shiftTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shiftTemplate.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  update(id: string, updateShiftDto: UpdateShiftDto) {
    return this.prisma.shiftTemplate.update({
      where: { id },
      data: this.toShiftData(updateShiftDto),
    });
  }

  remove(id: string) {
    return this.prisma.shiftTemplate.delete({
      where: { id },
    });
  }

  private toShiftData(
    shiftDto: UpdateShiftDto,
  ): Prisma.ShiftTemplateUpdateInput {
    return {
      ...(shiftDto.name !== undefined && { name: shiftDto.name }),
      ...(shiftDto.startTime !== undefined && {
        startTime: this.timeToDate(shiftDto.startTime),
      }),
      ...(shiftDto.endTime !== undefined && {
        endTime: this.timeToDate(shiftDto.endTime),
      }),
      ...(shiftDto.requiredHours !== undefined && {
        requiredHours: shiftDto.requiredHours,
      }),
      ...(shiftDto.maxBreakHours !== undefined && {
        maxBreakHours: shiftDto.maxBreakHours,
      }),
      ...(shiftDto.latePenaltyRules !== undefined && {
        latePenaltyRules:
          shiftDto.latePenaltyRules as unknown as Prisma.InputJsonValue,
      }),
    };
  }

  private timeToDate(time: string) {
    return new Date(`1970-01-01T${time}:00.000Z`);
  }
}
