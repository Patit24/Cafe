import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export enum SalaryTypeDto {
  hourly = 'hourly',
  daily = 'daily',
  monthly = 'monthly',
}

export class CreateEmployeeDto {
  @IsString()
  @MaxLength(50)
  employeeCode!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsEnum(SalaryTypeDto)
  salaryType!: SalaryTypeDto;

  @IsNumber()
  @Min(0)
  salaryRate!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
