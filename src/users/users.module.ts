import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
// Importa el UsersService y UsersController si los tienes
// import { UsersService } from './users.service';
// import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // <-- Registra la entidad User
  ],
  // controllers: [UsersController], // Descomenta cuando los tengas
  // providers: [UsersService],       // Descomenta cuando los tengas
  exports: [
    TypeOrmModule, // <-- ¡Importante! Exporta el módulo de TypeORM
  ],
})
export class UsersModule {}