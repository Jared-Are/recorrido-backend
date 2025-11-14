import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlumnosModule } from './alumnos/alumnos.module';
import { AsistenciasModule } from './asistencias/asistencias.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PagosModule } from './pagos/pagos.module'; // <-- 1. IMPORTA EL NUEVO MÓDULO
import { GastosModule } from './gastos/gastos.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // --- INICIO DE LA NUEVA CONFIGURACIÓN ---
      type: 'postgres', // 1. Cambiamos a 'postgres'
      
      // 2. Leemos la URL de las variables de entorno
      url: process.env.DATABASE_URL, 
      
      autoLoadEntities: true,
      synchronize: true, // Esto creará las tablas en Supabase
      
      // 3. Requerido para conexiones en la nube
      ssl: {
        rejectUnauthorized: false,
      },
      // --- FIN DE LA NUEVA CONFIGURACIÓN ---
    }),
    
    // Tus módulos siguen igual
    AlumnosModule,
    AsistenciasModule,
    AuthModule,
    UsuariosModule,
    PagosModule, // <-- 2. AÑÁDELO AQUÍ
    GastosModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}