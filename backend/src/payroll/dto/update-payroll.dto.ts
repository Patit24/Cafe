import { IsEnum } from 'class-validator';

export enum PayrollStatusDto {
  generated = 'generated',
  locked = 'locked',
  paid = 'paid',
}

export class UpdatePayrollDto {
  @IsEnum(PayrollStatusDto)
  status!: PayrollStatusDto;
}
