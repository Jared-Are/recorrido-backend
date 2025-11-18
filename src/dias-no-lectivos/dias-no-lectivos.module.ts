import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaNoLectivo } from './dia-no-lectivo.entity';
import { DiasNoLectivosService } from './dias-no-lectivos.service';
import { DiasNoLectivosController } from './dias-no-lectivos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DiaNoLectivo])],
  controllers: [DiasNoLectivosController],
  providers: [DiasNoLectivosService],
  exports: [DiasNoLectivosService], // <-- ¡MUY IMPORTANTE!
})
export class DiasNoLectivosModule {}