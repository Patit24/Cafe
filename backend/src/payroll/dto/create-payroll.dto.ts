import { IsDateString, IsUUID } from 'class-validator';

export class CreatePayrollDto {
  @IsUUID()
  employeeId!: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;
}
