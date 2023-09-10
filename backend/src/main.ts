import { NestFactory } from "@nestjs/core";
import { UserModule } from "./User/user.module";
import * as dotenv from "dotenv";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(UserModule);
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
