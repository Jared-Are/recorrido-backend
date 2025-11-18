import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  // UseGuards, // <-- 1. Comentado
  // Req,      // <-- 2. Comentado
} from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { CreateLoteAsistenciaDto } from './dto/create-lote-asistencia.dto';
import { QueryHistorialDto } from './dto/query-historial.dto';
// import { AuthGuard } from '@nestjs/passport'; // <-- 3. Comentado

@Controller('asistencia')
// @UseGuards(AuthGuard('jwt')) // <-- 4. Comentado
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  // --- ID DE PRUEBA ---
  // 5. ¡Crea un ID falso de un Asistente que exista en tu BD!
  //    (Ve a tu DBeaver/PgAdmin y copia un ID de la tabla 'users' que sea asistente)
  private readonly TEST_ASISTENTE_ID = '89bb162e-42b2-4629-870a-a5d404e05dc3';

  @Get('resumen-hoy')
  getResumenHoy(/* @Req() req */) { // <-- 6. Comentado
    // const asistenteId = req.user.id;
    const asistenteId = this.TEST_ASISTENTE_ID; // <-- 7. Añadido
    return this.asistenciaService.getResumenHoy(asistenteId);
  }

  @Get('alumnos-del-dia')
  getAlumnosParaAsistencia(/* @Req() req */) { // <-- 8. Comentado
    // const asistenteId = req.user.id;
    const asistenteId = this.TEST_ASISTENTE_ID; // <-- 9. Añadido
    return this.asistenciaService.getAlumnosParaAsistencia(asistenteId);
  }

  @Post('registrar-lote')
  registrarLote(
    @Body() loteDto: CreateLoteAsistenciaDto,
    /* @Req() req */ // <-- 10. Comentado
  ) {
    // const asistenteId = req.user.id;
    const asistenteId = this.TEST_ASISTENTE_ID; // <-- 11. Añadido
    return this.asistenciaService.registrarLote(loteDto, asistenteId);
  }

  @Get('historial')
  getHistorial(
    @Query() query: QueryHistorialDto,
    /* @Req() req */ // <-- 12. Comentado
  ) {
    // const asistenteId = req.user.id;
    const asistenteId = this.TEST_ASISTENTE_ID; // <-- 13. Añadido
    return this.asistenciaService.getHistorial(asistenteId, query.mes);
  }
}