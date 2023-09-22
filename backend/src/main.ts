import { NestFactory, Reflector } from "@nestjs/core";
import * as dotenv from "dotenv";
import { CoreModule } from "./core.module";
import { ValidationPipe } from "@nestjs/common";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(CoreModule);
  app.enableCors(
    {
      origin: [process.env.VITE_API_URL],
      methods: ['POST', 'PUT', 'DELETE', 'GET']
    }
  );
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(app.get(Reflector));
  app.enableShutdownHooks()
  await app.listen(3000);
}
bootstrap();
