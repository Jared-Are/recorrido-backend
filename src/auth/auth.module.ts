import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [], // Puedes añadir UsuariosModule aquí después
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}