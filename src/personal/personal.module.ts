import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalService } from './personal.service';
import { PersonalController } from './personal.controller';
import { Personal } from './personal.entity';
import { VehiculosModule } from '../vehiculos/vehiculos.module';
import { UsersModule } from '../users/users.module'; // 👈 IMPORTANTE

@Module({
  imports: [
    TypeOrmModule.forFeature([Personal]),
    VehiculosModule,
    UsersModule // 👈 Necesario para usar UsersService
  ], 
  controllers: [PersonalController],
  providers: [PersonalService],
  exports: [TypeOrmModule] 
})
export class PersonalModule {}