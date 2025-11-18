import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AvisosService } from './avisos.service';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  @Post()
  create(@Body() createAvisoDto: CreateAvisoDto) {
    return this.avisosService.create(createAvisoDto);
  }

  @Get()
  findAll() {
    return this.avisosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.avisosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAvisoDto: UpdateAvisoDto) {
    return this.avisosService.update(id, updateAvisoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.avisosService.remove(id);
  }

  @Get('para-asistente')
  // @Roles('asistente') // Opcional, si tienes guard de roles
  findAllParaAsistente() {
    return this.avisosService.findAllParaAsistente();
}
}