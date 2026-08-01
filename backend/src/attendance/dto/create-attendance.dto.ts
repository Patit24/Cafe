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

  @IsNumber()
  @Min(0)
  @Max(100)
  faceMatchScore!: number;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  livenessPassed?: boolean;
}
