import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

export const initKafka = (app: INestApplication) => {
  const configService = app.get(ConfigService);
  const kafkaBrokers = configService.get<string[]>('kafka.brokers');
  const kafkaGroupId = configService.get<string>('kafka.groupId');
  if (kafkaBrokers?.length && kafkaGroupId) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: kafkaBrokers,
        },
        consumer: {
          groupId: kafkaGroupId,
        },
      },
    });
  }
};
