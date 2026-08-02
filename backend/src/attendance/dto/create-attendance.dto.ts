import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAttendanceDto {
  @IsUUID()
  employeeId!: string;

  @IsString()
  deviceId!: string;

  @IsString()
  gpsLocation!: string;

  @IsOptional()
  @IsNumber()
  faceMatchScore?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  livenessPassed?: boolean;

  @IsOptional()
  @IsBoolean()
  isManualOverride?: boolean;
}
