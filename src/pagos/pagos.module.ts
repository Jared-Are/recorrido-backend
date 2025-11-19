import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from './pago.entity';
import { Alumno } from '../alumnos/alumno.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, Alumno]),
  ],
  controllers: [PagosController],
  providers: [PagosService],
  // ¡ESTA ES LA CLAVE!
  // Al exportarlo, permitimos que TutorModule (y otros) lo usen.
  exports: [PagosService], 
})
export class PagosModule {}