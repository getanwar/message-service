import { Injectable } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { SearchMessageData } from './messages.types';

@Injectable()
export class MessagesProducer {
  constructor(private readonly kafkaService: KafkaService) {}

  publishMessageCreated(payload: SearchMessageData) {
    return this.kafkaService.emit('message.created', payload);
  }
}
