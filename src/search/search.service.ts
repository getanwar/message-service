import { Injectable } from '@nestjs/common';

import {
  MessageOutput,
  SearchMessageData,
  SearchInConversationMessagesInput,
} from '../common/common.types';
import { ElasticsearchRepository } from './search.repository';

interface ISearchService {
  searchInConversationMessages(
    input: SearchInConversationMessagesInput,
  ): Promise<MessageOutput[]>;
  indexMessage(id: string, message: SearchMessageData): Promise<any>;
}

@Injectable()
export class SearchService implements ISearchService {
  constructor(
    private readonly elasticsearchRepository: ElasticsearchRepository,
  ) {}

  async searchInConversationMessages(
    input: SearchInConversationMessagesInput,
  ): Promise<MessageOutput[]> {
    const result =
      await this.elasticsearchRepository.searchInConversationMessages(input);
    return result.map((res) => res.data);
  }

  async indexMessage(id: string, message: SearchMessageData) {
    return await this.elasticsearchRepository.indexMessage(id, message);
  }
}
