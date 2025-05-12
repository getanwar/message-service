import { Injectable } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';

import {
  MessageOutput,
  SearchInConversationMessagesInput,
} from 'src/common/common.types';
import { buildMessagesSearchQuery } from './search.helpers';

type SearchIndexType = 'messages';
type SearchResultType<T> = {
  docId: string;
  score: number;
  data: T;
};

interface ISearchRepository {
  searchInConversationMessages(
    input: SearchInConversationMessagesInput,
  ): Promise<SearchResultType<MessageOutput>[]>;
  indexMessage(id: string, body: object): Promise<any>;
  createMessageIndex(): Promise<void>;
}

@Injectable()
export class ElasticsearchRepository implements ISearchRepository {
  constructor(
    private readonly elasticsearchService: NestElasticsearchService,
  ) {}

  async searchInConversationMessages(
    input: SearchInConversationMessagesInput,
  ): Promise<SearchResultType<MessageOutput>[]> {
    const {
      search,
      websiteId,
      conversationId,
      filter: { page, perPage },
    } = input;
    const response = await this.elasticsearchService.search<MessageOutput>({
      index: 'messages',
      size: perPage,
      from: (page - 1) * perPage,
      query: buildMessagesSearchQuery({ search, websiteId, conversationId }),
    });

    return response.hits.hits.map((hit) => ({
      docId: hit._id as string,
      score: hit._score as number,
      data: hit._source as MessageOutput,
    }));
  }

  async indexMessage(id: string, body: object) {
    const response = await this.elasticsearchService.index({
      index: 'messages',
      id,
      body,
    });
    console.log('Indexing response:', response);
    return response;
  }

  async createMessageIndex() {
    const indexName: SearchIndexType = 'messages';
    const exists = await this.elasticsearchService.indices.exists({
      index: indexName,
    });
    if (exists) {
      console.log(`Index "${indexName}" already exists`);
      return;
    }

    const response = await this.elasticsearchService.indices.create({
      index: indexName,
      mappings: {
        properties: {
          websiteId: { type: 'keyword' },
          conversationId: { type: 'keyword' },
          content: { type: 'text' },
        },
      },
    });
    if (response.acknowledged) {
      console.log(`Index "${indexName}" created successfully`);
    }
  }
}
