import { Controller, Get, Patch, UseGuards, Request } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { AuthGuard } from '../supabase/auth.guard'; // Opcional si ya es global, pero no estorba

@Controller('notificaciones')
// @UseGuards(AuthGuard) // Puedes quitarlo si ya usas el global en app.module
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  // Obtener mis notificaciones
  @Get()
  obtenerMisNotificaciones(@Request() req: any) {
    // req.user viene del AuthGuard
    return this.notificacionesService.obtenerMisNotificaciones(req.user.id);
  }

  // Contar cuántas tengo sin leer (para el puntito rojo 🔴)
  @Get('count')
  contarNoLeidas(@Request() req: any) {
    return this.notificacionesService.contarNoLeidas(req.user.id);
  }

  // Marcar todas como leídas (cuando abres la campana)
  @Patch('leer-todas')
  marcarLeidas(@Request() req: any) {
    return this.notificacionesService.marcarTodasComoLeidas(req.user.id);
  }
}