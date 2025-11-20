import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- 1. HABILITAR CORS ---
  // Esto permite que tu frontend haga peticiones a este backend
  app.enableCors(); 

  // --- 2. USAR VALIDATION PIPES ---
  // Esto valida y transforma tu JSON de entrada en DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true, 
  }));

  await app.listen(process.env.PORT || 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

//forzaar