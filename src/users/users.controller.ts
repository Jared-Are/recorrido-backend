import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
// Importante: Asegúrate de que este archivo exista en src/common/public.decorator.ts
import { Public } from '../common/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- RUTAS PROTEGIDAS (Requieren Token) ---

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post(':id/invitacion')
  generarInvitacion(@Param('id') id: string) {
    return this.usersService.generarTokenInvitacion(id);
  }

  // --- RUTAS PÚBLICAS (Sin Token) ---

  // 🚨 BOTÓN DE PÁNICO (Público para poder recuperar acceso si te quedas fuera)
  @Public()
  @Get('seed')
  crearAdminDeEmergencia() {
    return this.usersService.createAdminSeed();
  }

  // ACTIVAR CUENTA (Público porque el usuario viene de WhatsApp sin sesión)
  @Public()
  @Post('activar')
  activar(@Body() body: { token: string; password: string }) {
    return this.usersService.activarCuenta(body.token, body.password);
  }

  // INICIAR SESIÓN (Público obviamente)
  @Public()
  @Post('login')
  login(@Body() body: { username: string; contrasena: string }) {
    return this.usersService.login(body.username, body.contrasena);
  }
}