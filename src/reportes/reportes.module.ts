import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

// Importar entidades
import { Pago } from '../pagos/pago.entity';
import { Gasto } from '../gastos/gasto.entity';
import { Asistencia } from '../asistencias/asistencia.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, Gasto, Asistencia, Alumno, Vehiculo])
  ],
  controllers: [ReportesController],
  providers: [ReportesService]
})
export class ReportesModule {}