import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';       // <-- AÑADIR
import { UsersController } from './users.controller'; // <-- AÑADIR

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController], // <-- AÑADIR
  providers: [UsersService],      // <-- AÑADIR
  exports: [TypeOrmModule, UsersService], // Exportar Service también
})
export class UsersModule {}