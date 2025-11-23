import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 🛡️ 1. HABILITAR CORS DE FORMA SEGURA (VERSIÓN VERCEL)
  const allowedOrigins = [
    'http://localhost:3000', // Local
    'http://localhost:3001', // Local alternativo
    process.env.FRONTEND_URL, // Tu URL principal definida en variables de entorno
    // Agrega aquí tu dominio exacto de Vercel si lo conoces:
    'https://recorrido-lac.vercel.app' 
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // 1. Permitir peticiones sin origen (Postman, Apps móviles)
      if (!origin) return callback(null, true);

      // 2. Permitir orígenes explícitos (localhost, variable de entorno)
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // 3. 🚨 REGLA ESPECIAL PARA VERCEL 🚨
      // Esto permite tu dominio principal Y las Deploy Previews (ramas de prueba)
      // Cambia "recorrido" por el nombre de tu proyecto o usa simplemente /\.vercel\.app$/
      if (origin.endsWith('.vercel.app')) {
         return callback(null, true);
      }

      logger.warn(`🔒 Bloqueada petición CORS sospechosa desde: ${origin}`);
      callback(null, false);
    },
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
  
  logger.log(`\n\n🛡️ SERVIDOR SEGURO INICIADO EN PUERTO: ${port}`);
  logger.log(`🛡️ CORS HABILITADO PARA VERCEL Y LOCALHOST\n`);
}
bootstrap();