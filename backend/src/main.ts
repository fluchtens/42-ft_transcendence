import { NestFactory } from '@nestjs/core';
import { UserModule } from './User/user.module';

async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  // app.enableCors(
  //   {
  //     origin: ['http://localhost'],
  //     methods: ['POST', 'PUT', 'DELETE', 'GET']
  //   }
  // );
  app.enableShutdownHooks()
  await app.listen(3000);
}
bootstrap();
