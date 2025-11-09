import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Patch, Delete, HttpCode } from '@nestjs/common'; // <-- 1. Importa Delete y HttpCode
import { AlumnosService } from './alumnos.service';
import { CreateAlumnoDto } from './dto/create-alumno.dto';
import { UpdateAlumnoDto } from './dto/update-alumno.dto'; // <-- 2. Importa el DTO

@Controller('alumnos')
export class AlumnosController {
  
  constructor(private readonly alumnosService: AlumnosService) {}

  @Get()
  findAll() {
    return this.alumnosService.findAll();
  }

  @Post()
  create(@Body() createAlumnoDto: CreateAlumnoDto) {
    return this.alumnosService.create(createAlumnoDto);
  }

  // --- 2. AÑADE ESTE NUEVO MÉTODO ---
  @Get(':id') // Responde a peticiones GET /alumnos/un-id-aqui
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // El 'id' de @Param('id') debe coincidir con el ':id' de @Get(':id')
    // ParseUUIDPipe valida que el ID sea un UUID válido
    return this.alumnosService.findOne(id);
  }


  // --- 3. AÑADE ESTE NUEVO MÉTODO ---
  @Patch(':id') // Responde a peticiones PATCH /alumnos/un-id-aqui
  update(
    @Param('id', ParseUUIDPipe) id: string, // Captura el ID
    @Body() updateAlumnoDto: UpdateAlumnoDto, // Captura el body
  ) {
    return this.alumnosService.update(id, updateAlumnoDto);
  }


  // --- 2. AÑADE ESTE NUEVO MÉTODO ---
  @Delete(':id') // Responde a peticiones DELETE /alumnos/un-id-aqui
  @HttpCode(204) // <-- Buena práctica: Un DELETE exitoso no devuelve contenido
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.alumnosService.remove(id);
  }
}