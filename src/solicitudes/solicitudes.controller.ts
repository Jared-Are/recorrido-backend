import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  create(@Body() body: any) {
    return this.solicitudesService.create(body);
  }

  @Get()
  findAll() {
    return this.solicitudesService.findAll();
  }

  @Post(':id/aprobar')
  aprobar(@Param('id') id: string) {
    return this.solicitudesService.aprobar(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.solicitudesService.remove(id);
  }
}