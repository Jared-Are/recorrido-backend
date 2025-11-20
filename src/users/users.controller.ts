import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Public } from '../common/public.decorator'; // <--- IMPORTANTE: El decorador que creamos

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. OBTENER TODOS LOS USUARIOS
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 2. BUSCAR UN USUARIO POR ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // 3. CREAR USUARIO (Llama a Supabase y luego guarda local)
  // Este requiere token (solo admin/propietario debería poder crear)
  @Post()
  create(@Body() datos: Partial<User>) {
    return this.usersService.create(datos);
  }

  // 4. GENERAR INVITACIÓN WHATSAPP
  @Post(':id/invitacion')
  invitarUsuario(@Param('id') id: string) {
    return this.usersService.generarTokenInvitacion(id);
  }

  // 5. BUSCAR EMAIL POR USUARIO (LOGIN HÍBRIDO)
  // Este DEBE ser público para que el usuario pueda preguntar su email antes de tener token.
  @Public()
  @Post('lookup')
  async lookupEmail(@Body() body: { identifier: string }) {
    return this.usersService.findEmailByIdentifier(body.identifier);
  }
}