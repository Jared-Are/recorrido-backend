import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';
import { Gasto } from './gasto.entity';
// Importamos VehiculosModule y PersonalModule para las relaciones
import { VehiculosModule } from '../vehiculos/vehiculos.module';
import { PersonalModule } from '../personal/personal.module'; // <-- 1. IMPORTAR

@Module({
  imports: [
    TypeOrmModule.forFeature([Gasto]),
    VehiculosModule, // <-- 2. AÑADIR (para la relación con Vehículo)
    PersonalModule   // <-- 2. AÑADIR (para la relación con Personal)
  ], 
  controllers: [GastosController],
  providers: [GastosService],
})
export class GastosModule {}