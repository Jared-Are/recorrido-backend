import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 1. Importa el controlador y servicio principales
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 2. Importa TODOS tus módulos de funcionalidades
import { AlumnosModule } from './alumnos/alumnos.module';
import { AsistenciasModule } from './asistencias/asistencias.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'recorrido.db',
      autoLoadEntities: true,
      synchronize: true, // Perfecto para desarrollo
    }),
    
    // 3. Añade tus módulos a la lista de imports
    AlumnosModule,
    AsistenciasModule,
    AuthModule,
    UsuariosModule,
  ],
  
  // 4. Vuelve a declarar tu controlador y servicio principales
  //    (Esto hará que la ruta GET / vuelva a funcionar)
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}