import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Body() body: CreateAttendanceDto) {
    return this.attendanceService.checkIn(
      body.employeeId,
      body.deviceId,
      body.gpsLocation,
      body.faceMatchScore ?? -1,
      body.photoUrl,
      body.livenessPassed,
      body.isManualOverride ?? false,
    );
  }

  @Post('start-break/:recordId')
  startBreak(@Param('recordId') recordId: string) {
    return this.attendanceService.startBreak(recordId);
  }

  @Post('resume-duty/:recordId/:breakId')
  resumeDuty(
    @Param('breakId') breakId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.attendanceService.resumeDuty(breakId, recordId);
  }

  @Post('check-out/:recordId')
  checkOut(@Param('recordId') recordId: string) {
    return this.attendanceService.checkOut(recordId);
  }

  @Post('verify-face')
  verifyFace(
    @Body() body: { employeeId: string; livePhotoBase64?: string; liveVector?: number[] },
  ) {
    return this.attendanceService.verifyFace(body.employeeId, body.livePhotoBase64, body.liveVector);
  }

  @Get()
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get('heatmap/:employeeId')
  getEmployeeHeatmap(@Param('employeeId') employeeId: string) {
    return this.attendanceService.getEmployeeHeatmap(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }
}
