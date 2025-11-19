import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionEscolar } from './configuracion.entity';
import { ConfiguracionService } from './configuracion.service';
import { ConfiguracionController } from './configuracion.controller';

// Importar las otras entidades
import { Alumno } from '../alumnos/alumno.entity';
import { Pago } from '../pagos/pago.entity';
import { User } from '../users/user.entity';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { Personal } from '../personal/personal.entity'; // <--- 1. IMPORTAR ESTO


@Module({
  imports: [
    // Registramos todas las entidades que necesitamos contar
    TypeOrmModule.forFeature([ConfiguracionEscolar, Alumno, Pago, User, Vehiculo, Personal])
  ],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService],
  exports: [ConfiguracionService],
})
export class ConfiguracionModule {}