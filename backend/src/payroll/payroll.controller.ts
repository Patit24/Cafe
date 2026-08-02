import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('generate')
  generatePayroll(@Body() body: CreatePayrollDto) {
    return this.payrollService.generatePayroll(
      body.employeeId,
      new Date(body.periodStart),
      new Date(body.periodEnd),
    );
  }

  @Post('generate-all')
  generateAll() {
    return this.payrollService.generateAll();
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
  updateStatus(@Param('id') id: string, @Body() body: UpdatePayrollDto) {
    return this.payrollService.updateStatus(id, body.status);
  }
}
