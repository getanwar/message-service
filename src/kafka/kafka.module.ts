import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport, KafkaOptions } from '@nestjs/microservices';

import { KafkaService } from './kafka.service';
import { KafkaAdminService } from './kafka-admin.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'MESSAGES_SERVICE',
        useFactory: (configService: ConfigService): KafkaOptions => {
          const clientId = configService.get<string>('kafka.clientId');
          const brokers = configService.get<string[]>('kafka.brokers');
          const groupId = configService.get<string>('kafka.groupId');

          if (!clientId) {
            throw new Error('Kafka clientId is not defined in configuration');
          }

          if (!brokers || !brokers.length) {
            throw new Error('Kafka brokers are not defined in configuration');
          }

          if (!groupId) {
            throw new Error('Kafka groupId is not defined in configuration');
          }

          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId,
                brokers,
              },
              consumer: {
                groupId,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaService, KafkaAdminService],
  exports: [KafkaService, KafkaAdminService],
})
export class KafkaModule {}
