import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { CreateLoteAsistenciaDto } from './dto/create-lote-asistencia.dto';
import { QueryHistorialDto } from './dto/query-historial.dto';
import { AuthGuard } from '@nestjs/passport'; // O tu Guard de JWT

@Controller('asistencia')
@UseGuards(AuthGuard('jwt')) // <-- ¡IMPORTANTE! Proteger todas las rutas
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Get('resumen-hoy')
  getResumenHoy(@Req() req) {
    const asistenteId = req.user.id; // Asumo que el ID está en req.user
    return this.asistenciaService.getResumenHoy(asistenteId);
  }

  @Get('alumnos-del-dia')
  getAlumnosParaAsistencia(@Req() req) {
    const asistenteId = req.user.id;
    return this.asistenciaService.getAlumnosParaAsistencia(asistenteId);
  }

  @Post('registrar-lote')
  registrarLote(@Body() loteDto: CreateLoteAsistenciaDto, @Req() req) {
    const asistenteId = req.user.id;
    return this.asistenciaService.registrarLote(loteDto, asistenteId);
  }

  @Get('historial')
  getHistorial(@Query() query: QueryHistorialDto, @Req() req) {
    const asistenteId = req.user.id;
    return this.asistenciaService.getHistorial(asistenteId, query.mes);
  }
}