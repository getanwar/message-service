import { Injectable } from '@nestjs/common';

import type {
  CreateMessageInput,
  GetConversationMessagesInput,
} from './messages.types';
import { MessagesRepository } from './messages.repository';
import { CreateMessageInputDto, MongoMessageOutputDto } from './messages.dto';

interface IMessagesService {
  create(message: CreateMessageInputDto): Promise<MongoMessageOutputDto>;
  getConversationMessages(
    input: GetConversationMessagesInput,
  ): Promise<MongoMessageOutputDto[]>;
}

@Injectable()
export class MessagesService implements IMessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  create(message: CreateMessageInput) {
    return this.messagesRepository.create(message);
  }

  getConversationMessages(input: GetConversationMessagesInput) {
    return this.messagesRepository.getConversationMessages(input);
  }
}
