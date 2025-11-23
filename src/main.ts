import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. HABILITAR CORS (Crucial para que el frontend pueda enviar el token)
  app.enableCors({
    origin: '*', // Permitir todo (para desarrollo es lo mejor)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization, x-user-id', // Aceptamos nuestros headers
  });

  // 2. Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 3. Usar el puerto de Render o el 3000
  await app.listen(process.env.PORT || 3000);
}
bootstrap();