import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Body() body: { employeeId: string; deviceId: string; gpsLocation: string; faceMatchScore: number }) {
    return this.attendanceService.checkIn(body.employeeId, body.deviceId, body.gpsLocation, body.faceMatchScore);
  }

  @Post('start-break/:recordId')
  startBreak(@Param('recordId') recordId: string) {
    return this.attendanceService.startBreak(recordId);
  }

  @Post('resume-duty/:recordId/:breakId')
  resumeDuty(@Param('breakId') breakId: string, @Param('recordId') recordId: string) {
    return this.attendanceService.resumeDuty(breakId, recordId);
  }

  @Post('check-out/:recordId')
  checkOut(@Param('recordId') recordId: string) {
    return this.attendanceService.checkOut(recordId);
  }

  @Get()
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }
}
