import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. OBTENER TODOS (Sirve para listar alumnos, asistentes, etc.)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 2. BUSCAR UNO
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // 3. CREAR USUARIO (Tutor, Asistente o Chofer)
  // La magia está en el campo "rol" que viene en el body.
  // Si envías { nombre: "Juan", rol: "asistente" }, se crea como asistente.
  @Post()
  create(@Body() datos: Partial<User>) {
    return this.usersService.create(datos);
  }

  // 4. GENERAR INVITACIÓN WHATSAPP
  // Funciona igual para todos. Genera el link mágico.
  @Post(':id/invitacion')
  invitarUsuario(@Param('id') id: string) {
    return this.usersService.generarTokenInvitacion(id);
  }

  // NOTA:
  // Ya NO necesitamos 'login', 'activar' ni 'seed'.
  // Todo eso lo maneja Supabase automáticamente.
}