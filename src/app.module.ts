import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <--- AQUÍ FALTABA ConfigService
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Tus módulos
import { AlumnosModule } from './alumnos/alumnos.module';
import { AsistenciaModule } from './asistencias/asistencia.module';
//import { AuthModule } from './auth/auth.module';
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
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    // 1. Configuración Global (Carga el .env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Base de Datos ASÍNCRONA (Espera a leer el config)
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
        ssl: {
          rejectUnauthorized: false, // Necesario para Supabase/Render
        },
      }),
    }), // <--- ¡ESTO CIERRA LA CONFIGURACIÓN DE LA BD!

    // 3. Tus módulos (van separados por coma)
    AlumnosModule,
    AsistenciaModule,
   // AuthModule,
    UsersModule,
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
    SupabaseModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}