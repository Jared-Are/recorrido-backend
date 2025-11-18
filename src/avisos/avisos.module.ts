import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvisosService } from './avisos.service';
import { AvisosController } from './avisos.controller';
import { Aviso } from './aviso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Aviso])],
  controllers: [AvisosController],
  providers: [AvisosService],
  exports: [TypeOrmModule], // <-- ¡AÑADE ESTA LÍNEA!
})
export class AvisosModule {}