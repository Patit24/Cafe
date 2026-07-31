import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EmployeesModule } from './employees/employees.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PayrollModule } from './payroll/payroll.module';
import { LeavesModule } from './leaves/leaves.module';

@Module({
  imports: [PrismaModule, EmployeesModule, ShiftsModule, AttendanceModule, PayrollModule, LeavesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
