import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service'; // Asegúrate de tener tu servicio de usuarios

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Listar usuarios para tu panel de Admin
  @Get()
  findAll() {
    return this.usersService.findAll(); // Asumo que tienes este método
  }
// 2. CREAR USUARIO (ESTE ES EL QUE FALTABA O FALLABA)
  @Post()
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  // 3. BUSCAR UNO
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }


  // --- ENDPOINT PARA EL BOTÓN DE WHATSAPP ---
  @Post(':id/invitacion')
  async generarInvitacion(@Param('id') id: string) {
    const datos = await this.usersService.generarTokenInvitacion(id);
    return datos; 
    // El frontend recibirá { link, mensaje } y abrirá window.open(`https://wa.me/...`)
  }
}