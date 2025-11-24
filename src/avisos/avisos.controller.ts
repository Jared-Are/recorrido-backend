import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AvisosService } from './avisos.service';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('avisos')
@UseGuards(AuthGuard)
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

  // 🚨 RUTAS ESTÁTICAS PRIMERO (Antes de :id)
  @Get('para-tutor')
  findAllParaTutor() {
    return this.avisosService.findAllParaTutor();
  }

  @Get('para-asistente')
  findAllParaAsistente() {
    return this.avisosService.findAllParaAsistente();
  }

  // 🚨 RUTAS DINÁMICAS AL FINAL
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
}