import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalService } from './personal.service';
import { PersonalController } from './personal.controller';
import { Personal } from './personal.entity';
import { VehiculosModule } from '../vehiculos/vehiculos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Personal]),
    VehiculosModule 
  ], 
  controllers: [PersonalController],
  providers: [PersonalService],
  exports: [TypeOrmModule] // Exportamos para que GastosModule pueda usarlo
})
export class PersonalModule {}