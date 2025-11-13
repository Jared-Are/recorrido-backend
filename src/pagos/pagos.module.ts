import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from './pago.entity';
import { AlumnosModule } from '../alumnos/alumnos.module'; // <-- 1. IMPORTAR

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago]),
    AlumnosModule // <-- 2. AÑADIR AQUÍ
  ], 
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}