import { Injectable } from '@nestjs/common';
import { KafkaRepository } from './kafka.repository';

type Topics = {
  'message.created': {
    id: string;
    content: string;
    timestamp: Date;
    websiteId: string;
    conversationId: string;
  };
};

@Injectable()
export class KafkaService {
  constructor(private readonly kafkaRepository: KafkaRepository) {}

  emit<K extends keyof Topics>(topic: K, message: Topics[K]) {
    return this.kafkaRepository.emit(topic, message);
  }
}
