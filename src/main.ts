import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { initKafka } from './lib/kafka';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  initKafka(app);
  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
