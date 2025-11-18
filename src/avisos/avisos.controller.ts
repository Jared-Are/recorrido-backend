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



  @Get('para-tutor')
  findAllParaTutor() {
    return this.avisosService.findAllParaTutor();
  }

  // --- ARREGLO AQUÍ ---
  // Las rutas estáticas (texto fijo) van PRIMERO
  @Get('para-asistente')
  findAllParaAsistente() {
    return this.avisosService.findAllParaAsistente();
  }

  // Las rutas dinámicas (con parámetros) van DESPUÉS
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.avisosService.findOne(id);
  }
  // --- FIN DEL ARREGLO ---

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAvisoDto: UpdateAvisoDto) {
    return this.avisosService.update(id, updateAvisoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.avisosService.remove(id);
  }
}