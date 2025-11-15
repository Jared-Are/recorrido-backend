import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalService } from './personal.service';
import { PersonalController } from './personal.controller';
import { Personal } from './personal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Personal])], // Conecta la Entidad
  controllers: [PersonalController],
  providers: [PersonalService],
})
export class PersonalModule {}