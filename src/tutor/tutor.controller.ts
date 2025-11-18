import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('tutor')
// @UseGuards(AuthGuard('jwt')) // <-- Descomenta cuando tengas login en el front
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  // ID TEMPORAL DE PRUEBA (Copia el ID de un usuario con rol 'tutor' de tu BD)
  private readonly TEST_TUTOR_ID = 'AQUÍ_VA_UN_UUID_DE_TUTOR'; 

  @Get('resumen')
  getResumen(/* @Req() req */) {
    // const userId = req.user.id;
    return this.tutorService.getResumen(this.TEST_TUTOR_ID);
  }

  @Get('asistencias')
  getAsistencias(/* @Req() req */) {
    return this.tutorService.getAsistencias(this.TEST_TUTOR_ID);
  }
}