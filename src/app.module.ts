import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlumnosModule } from './alumnos/alumnos.module';
import { AsistenciaModule } from './asistencias/asistencia.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PagosModule } from './pagos/pagos.module'; // <-- 1. IMPORTA EL NUEVO MÓDULO
import { GastosModule } from './gastos/gastos.module';
import { PersonalModule } from './personal/personal.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { AvisosModule } from './avisos/avisos.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { DiasNoLectivosModule } from './dias-no-lectivos/dias-no-lectivos.module'; // <-- IMPORTACIÓN CORRECTA
import { TutorModule } from './tutor/tutor.module';
import { ReportesModule } from './reportes/reportes.module';
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
    AsistenciaModule,
    AuthModule,
    UsersModule,
    PagosModule, // <-- 2. AÑÁDELO AQUÍ
    GastosModule,
    PersonalModule,
    VehiculosModule,
    AvisosModule,
    ConfiguracionModule,
    DiasNoLectivosModule, // <-- AÑADE EL MÓDULO AQUÍ
    TutorModule,
    ReportesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}