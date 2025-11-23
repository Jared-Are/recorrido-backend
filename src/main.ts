import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. HABILITAR CORS
  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization, x-user-id', 
  });

  // 2. Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`\n\n🚀 ============================================================`);
  logger.log(`🚀 SERVIDOR INICIADO EN PUERTO: ${port}`);
  logger.log(`🚀 VERSIÓN DE DEBUG: USERS MODULE FIX (Si lees esto, el código es nuevo)`);
  logger.log(`🚀 ============================================================\n\n`);
}
bootstrap();