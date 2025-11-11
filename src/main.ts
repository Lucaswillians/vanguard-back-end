import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ["https://vanguardsystem.com.br", "https://www.vanguardsystem.com.br", "http://localhost:5173"],
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
