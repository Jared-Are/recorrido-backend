import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';
import { Gasto } from './gasto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto])], // Conecta la Entidad
  controllers: [GastosController],
  providers: [GastosService],
})
export class GastosModule {}