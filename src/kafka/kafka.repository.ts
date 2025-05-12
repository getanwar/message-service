import {
  Inject,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaRepository implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('MESSAGES_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }

  emit(topic: string, message: object) {
    return this.kafkaClient.emit(topic, message);
  }
}
