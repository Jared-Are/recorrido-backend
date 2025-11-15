import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpCode, Query } from '@nestjs/common';
import { PersonalService } from './personal.service';
import { CreatePersonalDto } from './dto/create-personal.dto';
import { UpdatePersonalDto } from './dto/update-personal.dto';

@Controller('personal')
export class PersonalController {
  constructor(private readonly personalService: PersonalService) {}

  @Post()
  create(@Body() createPersonalDto: CreatePersonalDto) {
    return this.personalService.create(createPersonalDto);
  }

  @Get()
  findAll(@Query('estado') estado: string) {
    if (estado === 'activo' || estado === 'inactivo') {
      return this.personalService.findAllByEstado(estado);
    }
    return this.personalService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.personalService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updatePersonalDto: UpdatePersonalDto
  ) {
    return this.personalService.update(id, updatePersonalDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.personalService.remove(id);
  }
}