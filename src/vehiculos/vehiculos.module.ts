import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { Vehiculo } from './vehiculo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo])], // Conecta la Entidad
  controllers: [VehiculosController],
  providers: [VehiculosService],
  exports: [TypeOrmModule], // <-- ¡AÑADE ESTA LÍNEA!
})
export class VehiculosModule {}