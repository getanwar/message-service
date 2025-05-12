import { Injectable } from '@nestjs/common';
import {
  MessageOutput,
  GetConversationMessagesInput,
  SearchInConversationMessagesInput,
} from '../common/common.types';
import { MessagesService } from '../messages/messages.service';
import { SearchService } from '../search/search.service';

interface IConversationService {
  getConversationMessages(
    input: GetConversationMessagesInput,
  ): Promise<MessageOutput[]>;
  searchInConversationMessages(
    input: SearchInConversationMessagesInput,
  ): Promise<MessageOutput[]>;
}

@Injectable()
export class ConversationsService implements IConversationService {
  constructor(
    private readonly searchService: SearchService,
    private readonly messagesService: MessagesService,
  ) {}

  async getConversationMessages(
    input: GetConversationMessagesInput,
  ): Promise<MessageOutput[]> {
    return await this.messagesService.getConversationMessages(input);
  }

  async searchInConversationMessages(
    input: SearchInConversationMessagesInput,
  ): Promise<MessageOutput[]> {
    return await this.searchService.searchInConversationMessages(input);
  }
}
