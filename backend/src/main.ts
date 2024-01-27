import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // const httpsOptions = {
  //   key: fs.readFileSync(path.join(__dirname, '../privkey.pem')),
  //   cert: fs.readFileSync(path.join(__dirname, '../fullchain.pem')),
  // };

  const app = await NestFactory.create(AppModule, {
    // httpsOptions,
  });

  app.enableCors({
    origin: process.env.VITE_FRONT_URL,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  app.use(
    cookieParser(),
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  );

  await app.listen(process.env.VITE_BACK_PORT);
}
bootstrap();
