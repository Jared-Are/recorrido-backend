import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AlumnosService } from './alumnos.service';
import { AuthGuard } from '../supabase/auth.guard';

@Controller('alumnos')
@UseGuards(AuthGuard) // 🔒 Protegido: Solo usuarios logueados
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Post()
  create(@Body() createAlumnoDto: any, @Request() req: any) {
    // CORRECCIÓN DEL ERROR 1: Ahora pasamos 2 argumentos (datos + ID del creador)
    return this.alumnosService.create(createAlumnoDto, req.user.id);
  }

  @Get()
  findAll(@Request() req: any, @Query('estado') estado?: string) {
    const user = req.user;
    const rol = user.user_metadata?.rol?.toLowerCase();
    
    console.log(`🔎 Consultando alumnos. Usuario: ${user.email}, Rol: ${rol}, Estado: ${estado}`);

    // CORRECCIÓN DEL ERROR 2: Usamos findAll o findByTutor
    
    // 👑 MODO OPERATIVO: Propietario, Admin y ASISTENTE ven TODO
    // El asistente necesita ver todos los alumnos para poder registrar asistencias en cualquier ruta
    if (rol === 'propietario' || rol === 'admin' || rol === 'asistente') {
        return this.alumnosService.findAll(estado);
    }

    // 👨‍👩‍👧‍👦 MODO TUTOR: Solo ve a sus hijos
    return this.alumnosService.findByTutor(user.id, estado);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alumnosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlumnoDto: any) {
    return this.alumnosService.update(id, updateAlumnoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alumnosService.remove(id);
  }
}