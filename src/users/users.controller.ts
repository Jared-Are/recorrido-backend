import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../common/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // =========================================================
  // 🚨 RUTAS PÚBLICAS Y ESTÁTICAS (DEBEN IR PRIMERO)
  // Si pones estas abajo de ':id', NestJS pensará que "login" es un ID
  // =========================================================

  // 1. LOOKUP (Necesario para tu Frontend actual)
  // Recibe { identifier: "admin" } y devuelve { email: "...", rol: "..." }
  @Public()
  @Post('lookup')
  lookup(@Body() body: { identifier: string }) {
    console.log('👉 PETICIÓN LOOKUP:', body);
    return this.usersService.lookupUser(body.identifier);
  }

  // 2. LOGIN (Alternativa Server-Side)
  @Public()
  @Post('login')
  login(@Body() body: { username: string; contrasena: string }) {
    return this.usersService.login(body.username, body.contrasena);
  }

  // 3. SEED / ADMIN DE EMERGENCIA
  @Public()
  @Get('seed')
  crearAdminDeEmergencia() {
    return this.usersService.createAdminSeed();
  }

  // 4. ACTIVAR CUENTA
  @Public()
  @Post('activar')
  activar(@Body() body: { token: string; password: string }) {
    return this.usersService.activarCuenta(body.token, body.password);
  }

  // =========================================================
  // RUTAS PROTEGIDAS O GENÉRICAS
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
  // 🚨 AL FINAL: LAS RUTAS DINÁMICAS (:id)
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