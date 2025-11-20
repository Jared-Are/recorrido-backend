import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { CreateLoteAsistenciaDto } from './dto/create-lote-asistencia.dto';
import { QueryHistorialDto } from './dto/query-historial.dto';

// Nota: No necesitamos @UseGuards(AuthGuard) porque el Guardia Global en app.module lo protege.

@Controller('asistencia')
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  // 1. RESUMEN DEL DÍA
  @Get('resumen-hoy')
  getResumenHoy(@Req() req: any) {
    // req.user.id viene del token de Supabase validado por AuthGuard
    return this.asistenciaService.getResumenHoy(req.user.id);
  }

  // 2. LISTA DE ALUMNOS PARA ASISTENCIA
  @Get('alumnos-del-dia')
  getAlumnosParaAsistencia(@Req() req: any) {
    return this.asistenciaService.getAlumnosParaAsistencia(req.user.id);
  }

  // 3. REGISTRAR ASISTENCIA (LOTE)
  @Post('registrar-lote')
  registrarLote(
    @Body() loteDto: CreateLoteAsistenciaDto,
    @Req() req: any,
  ) {
    return this.asistenciaService.registrarLote(loteDto, req.user.id);
  }

  // 4. HISTORIAL
  @Get('historial')
  getHistorial(
    @Query() query: QueryHistorialDto,
    @Req() req: any,
  ) {
    return this.asistenciaService.getHistorial(req.user.id, query.mes);
  }
}