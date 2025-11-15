import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpCode, Query } from '@nestjs/common';
// ... (tus otros imports)
import { AlumnosService } from './alumnos.service';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto';

@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Post()
  create(@Body() createAlumnoDto: CreateAlumnoDto) {
    return this.alumnosService.create(createAlumnoDto);
  }

  // --- ¡AQUÍ ESTÁ EL CAMBIO! ---
  @Get()
  findAll(@Query('estado') estado: string) {
    // Si el frontend envía ?estado=activo o ?estado=inactivo, usamos el filtro
    if (estado === 'activo' || estado === 'inactivo') {
      const activo = estado === 'activo'; // Convertir a booleano
      return this.alumnosService.findAllByEstado(activo);
    }
    // Si no, devolvemos todo (o el comportamiento por defecto que tuvieras)
    return this.alumnosService.findAll();
  }
  // --- FIN DEL CAMBIO ---

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.alumnosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateAlumnoDto: UpdateAlumnoDto
  ) {
    return this.alumnosService.update(id, updateAlumnoDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    // Esto es borrado FÍSICO. El borrado lógico se hace con PATCH.
    return this.alumnosService.remove(id);
  }
}