import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { CloudLogger } from './logger/cloud.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: new CloudLogger('Backend'),
  });

  app.enableCors({
    origin: [
      "https://vanguardsystem.com.br",
      "https://www.vanguardsystem.com.br",
      "http://localhost:5173",
    ],
    credentials: true,
  });

  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
