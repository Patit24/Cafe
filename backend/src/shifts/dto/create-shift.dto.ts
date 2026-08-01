import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class LatePenaltyRuleDto {
  @IsNumber()
  @Min(0)
  lateMinutes!: number;

  @IsNumber()
  @Min(0)
  deductHours!: number;
}

export class CreateShiftDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;

  @IsNumber()
  @Min(0)
  requiredHours!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBreakHours?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LatePenaltyRuleDto)
  latePenaltyRules?: LatePenaltyRuleDto[];
}
