import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(
    {
      origin: [process.env.VITE_API_URL],
      methods: ['POST', 'PUT', 'DELETE', 'GET']
    }
  );
  app.enableShutdownHooks()
  await app.listen(3000);
}
bootstrap();
