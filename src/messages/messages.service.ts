import { Injectable } from '@nestjs/common';

import type { CreateMessageInput } from './messages.types';
import { MessagesRepository } from './messages.repository';
import {
  CreateMessageInputDto,
  MessageCreatedEventDto,
  MongoMessageOutputDto,
} from './messages.dto';
import { GetConversationMessagesInput } from '../common/common.types';
import { KafkaService } from '../kafka/kafka.service';
import { SearchService } from '../search/search.service';

interface IMessagesService {
  create(message: CreateMessageInputDto): Promise<MongoMessageOutputDto>;
  getConversationMessages(
    input: GetConversationMessagesInput,
  ): Promise<MongoMessageOutputDto[]>;
}

@Injectable()
export class MessagesService implements IMessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly searchService: SearchService,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(input: CreateMessageInput) {
    const message = await this.messagesRepository.create(input);

    this.kafkaService.emit('message.created', {
      id: message.id,
      content: message.content,
      timestamp: message.timestamp,
      websiteId: message.websiteId,
      conversationId: message.conversationId,
    });

    return message;
  }

  getConversationMessages(input: GetConversationMessagesInput) {
    return this.messagesRepository.getConversationMessages(input);
  }

  async handleMessageCreated(message: MessageCreatedEventDto) {
    await this.searchService.indexMessage(message.id, message);
  }
}
