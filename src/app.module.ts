import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos Funcionales
import { AlumnosModule } from './alumnos/alumnos.module';
import { AsistenciaModule } from './asistencias/asistencia.module';
import { UsersModule } from './users/users.module';
import { PagosModule } from './pagos/pagos.module';
import { GastosModule } from './gastos/gastos.module';
import { PersonalModule } from './personal/personal.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { AvisosModule } from './avisos/avisos.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { DiasNoLectivosModule } from './dias-no-lectivos/dias-no-lectivos.module';
import { TutorModule } from './tutor/tutor.module';
import { ReportesModule } from './reportes/reportes.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';

// Módulos de Notificaciones y Tiempo Real (NUEVOS)
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { EventsModule } from './events/events.module';

// Supabase y Seguridad
import { SupabaseModule } from './supabase/supabase.module';
import { AuthGuard } from './supabase/auth.guard'; 

@Module({
  imports: [
    // 1. Configuración Global
    ConfigModule.forRoot({ isGlobal: true }),
    
    // 2. Base de Datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: { rejectUnauthorized: false }, 
      }),
    }),
    
    // 3. Módulos de la Aplicación
    SupabaseModule,
    UsersModule,
    AlumnosModule,
    AsistenciaModule,
    PagosModule,
    GastosModule,
    PersonalModule,
    VehiculosModule,
    AvisosModule,
    ConfiguracionModule,
    DiasNoLectivosModule,
    TutorModule,
    ReportesModule,
    SolicitudesModule,
    
    // 4. Nuevos Módulos de Notificaciones
    NotificacionesModule, // 👈 Para guardar historial de campanas
    EventsModule,         // 👈 Para WebSockets en tiempo real
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}