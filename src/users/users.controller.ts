import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. OBTENER TODOS LOS USUARIOS
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 2. CREAR USUARIO (Manual desde el panel)
  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  // 3. BUSCAR UN USUARIO POR ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // 4. GENERAR INVITACIÓN WHATSAPP (Devuelve link y mensaje con el username)
  @Post(':id/invitacion')
  generarInvitacion(@Param('id') id: string) {
    return this.usersService.generarTokenInvitacion(id);
  }

  // 5. ACTIVAR CUENTA (Recibe token y password nuevo)
  @Post('activar')
  activar(@Body() body: { token: string; password: string }) {
    return this.usersService.activarCuenta(body.token, body.password);
  }

  // 6. INICIAR SESIÓN (Ahora por Username)
  @Post('login')
  login(@Body() body: { username: string; contrasena: string }) {
    return this.usersService.login(body.username, body.contrasena);
  }
}