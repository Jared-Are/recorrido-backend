import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../common/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // =========================================================
  // 🚨 IMPORTANTE: LAS RUTAS ESTÁTICAS VAN PRIMERO
  // =========================================================

  // 1. LOGIN (Público)
  @Public()
  @Post('login')
  login(@Body() body: { username: string; contrasena: string }) {
    console.log('👉 PETICIÓN RECIBIDA EN CONTROLLER: /users/login', body);
    return this.usersService.login(body.username, body.contrasena);
  }

  // 2. SEED / ADMIN DE EMERGENCIA (Público)
  @Public()
  @Get('seed')
  crearAdminDeEmergencia() {
    return this.usersService.createAdminSeed();
  }

  // 3. ACTIVAR CUENTA (Público)
  @Public()
  @Post('activar')
  activar(@Body() body: { token: string; password: string }) {
    return this.usersService.activarCuenta(body.token, body.password);
  }

  // =========================================================
  // LUEGO LAS RUTAS GENÉRICAS
  // =========================================================

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  // =========================================================
  // 🚨 AL FINAL: LAS RUTAS CON PARÁMETROS (:id)
  // (Si pones esto arriba, se "come" a las rutas 'seed' o 'login')
  // =========================================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post(':id/invitacion')
  generarInvitacion(@Param('id') id: string) {
    return this.usersService.generarTokenInvitacion(id);
  }
}