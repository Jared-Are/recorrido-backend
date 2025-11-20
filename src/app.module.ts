import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // <--- IMPORTAR ESTO
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
import { SolicitudesModule } from './solicitudes/solicitudes.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
    type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // Esto creará las tablas automáticamente en Supabase
      ssl: { 
        rejectUnauthorized: false // <--- IMPORTANTE: Supabase exige SSL
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
    ReportesModule,
    SolicitudesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}