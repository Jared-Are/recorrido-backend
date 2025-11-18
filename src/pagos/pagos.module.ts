import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from './pago.entity';
import { AlumnosModule } from '../alumnos/alumnos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago]),
    AlumnosModule
  ],
  controllers: [PagosController],
  providers: [PagosService],
  // --- ¡ESTO ES LO QUE FALTA! ---
  exports: [
    PagosService, // <-- Exportar el servicio para que TutorModule lo vea
    TypeOrmModule // Exportar TypeOrm por si acaso
  ] 
})
export class PagosModule {}