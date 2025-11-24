import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';

// Entidades necesarias
import { Pago } from '../pagos/pago.entity';
import { Gasto } from '../gastos/gasto.entity';
import { Alumno } from '../alumnos/alumno.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

@Module({
  imports: [
    // Registramos todas las tablas que vamos a consultar
    TypeOrmModule.forFeature([Pago, Gasto, Alumno, Vehiculo])
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}