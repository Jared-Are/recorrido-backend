import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. OBTENER TODOS
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 2. CREAR USUARIO
  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  // 3. BUSCAR UNO
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // 4. GENERAR INVITACIÓN WHATSAPP
  @Post(':id/invitacion')
  generarInvitacion(@Param('id') id: string) {
    return this.usersService.generarTokenInvitacion(id);
  }

  // 5. ACTIVAR CUENTA (Este es el que te daba error)
  @Post('activar')
  activar(@Body() body: { token: string; password: string }) {
    // Ahora TypeScript debería reconocer este método si guardaste el servicio
    return this.usersService.activarCuenta(body.token, body.password);
  }
}