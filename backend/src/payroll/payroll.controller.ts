import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('generate')
  generatePayroll(@Body() body: { employeeId: string; periodStart: string; periodEnd: string }) {
    return this.payrollService.generatePayroll(
      body.employeeId,
      new Date(body.periodStart),
      new Date(body.periodEnd)
    );
  }

  @Get()
  findAll() {
    return this.payrollService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.payrollService.updateStatus(id, body.status);
  }
}
