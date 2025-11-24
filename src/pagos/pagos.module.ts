import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from './pago.entity';
import { Alumno } from '../alumnos/alumno.entity';
// 👇 IMPORTANTE: Importar la entidad User
import { User } from '../users/user.entity';

@Module({
  imports: [
    // 👇 Agregamos User aquí para que PagosService pueda usar 'usersRepository'
    TypeOrmModule.forFeature([Pago, Alumno, User]) 
  ],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService]
})
export class PagosModule {}