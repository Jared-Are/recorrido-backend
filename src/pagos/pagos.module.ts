import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from './pago.entity';
// 1. IMPORTA LA ENTIDAD ALUMNO
import { Alumno } from '../alumnos/alumno.entity'; 

@Module({
  imports: [
    // 2. AGREGA ALUMNO AQUÍ
    // Esto le permite al PagosService usar @InjectRepository(Alumno)
    TypeOrmModule.forFeature([Pago, Alumno]), 
  ],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}