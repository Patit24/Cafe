import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import type { EmployeeFacePayload } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Post(':id/faces')
  addFace(@Param('id') id: string, @Body() faceData: EmployeeFacePayload) {
    return this.employeesService.addFace(id, faceData);
  }

  @Get(':id/faces')
  getFaces(@Param('id') id: string) {
    return this.employeesService.getFaces(id);
  }

  @Delete('faces/:faceId')
  removeFace(@Param('faceId') faceId: string) {
    return this.employeesService.removeFace(faceId);
  }
}
