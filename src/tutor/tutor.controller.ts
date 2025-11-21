import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TutorService } from './tutor.service';
// El AuthGuard ya está configurado globalmente en app.module.ts

@Controller('tutor')
// NOTA: ELIMINAMOS @UseGuards(AuthGuard('jwt')) porque el guardia es global

export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  // 1. Resumen
  @Get('resumen')
  getResumen(@Req() req: any) { // <-- Descomentamos @Req()
    const userId = req.user.id; // <-- Usamos el ID del usuario autenticado (del token)
    // return this.tutorService.getResumen(this.TEST_TUTOR_ID); // Eliminamos la línea de prueba
    return this.tutorService.getResumen(userId); // <-- ¡LA CLAVE!
  }

  // 2. Historial de asistencias
  @Get('asistencias')
  getAsistencias(@Req() req: any) {
    return this.tutorService.getAsistencias(req.user.id);
  }

  // 3. Historial de Pagos
  @Get('pagos') 
  getPagos(@Req() req: any) {
    return this.tutorService.getPagos(req.user.id);
  }
  
  // 4. Avisos (Si tienes un endpoint de avisos en el controlador de tutor)
  @Get('avisos') 
  getAvisos(@Req() req: any) {
    // Nota: Esto asume que tienes un getAvisos en TutorService
    return this.tutorService.getAvisos(req.user.id);
  }
}