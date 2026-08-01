import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { name: string; status: string } {
    return {
      name: 'Evening Light Payroll Attendance API',
      status: 'ok',
    };
  }
}
