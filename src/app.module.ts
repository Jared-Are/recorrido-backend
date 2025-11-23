import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos
import { AlumnosModule } from './alumnos/alumnos.module';
import { AsistenciaModule } from './asistencias/asistencia.module';
import { UsersModule } from './users/users.module'; // 👈 AQUÍ
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

// Supabase
import { SupabaseModule } from './supabase/supabase.module';
import { AuthGuard } from './supabase/auth.guard'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    
    // Módulos funcionales
    SupabaseModule,
    UsersModule, // 👈 TIENE QUE ESTAR AQUÍ
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