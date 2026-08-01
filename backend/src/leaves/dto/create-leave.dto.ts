import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum LeaveTypeDto {
  paid = 'paid',
  unpaid = 'unpaid',
}

export enum LeaveStatusDto {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
}

export class CreateLeaveDto {
  @IsUUID()
  employeeId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  @MaxLength(2000)
  reason!: string;

  @IsEnum(LeaveTypeDto)
  type!: LeaveTypeDto;
}

export class UpdateLeaveDto {
  @IsOptional()
  @IsEnum(LeaveStatusDto)
  status?: LeaveStatusDto;
}
