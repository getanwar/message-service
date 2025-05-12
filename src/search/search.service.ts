import { Injectable } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';

type SearchIndexType = 'messages';
type SearchResultType<T> = {
  docId: string;
  score: number;
  data: T;
};

@Injectable()
export class SearchService {
  constructor(
    private readonly elasticsearchService: NestElasticsearchService,
  ) {}

  async search<Data>(
    index: SearchIndexType,
    body: object,
  ): Promise<SearchResultType<Data>[]> {
    try {
      const response = await this.elasticsearchService.search<Data>({
        index,
        body,
      });
      return response.hits.hits.map((hit) => ({
        docId: hit._id as string,
        score: hit._score as number,
        data: hit._source as Data,
      }));
    } catch (error) {
      console.error(error);
      throw new Error('Search failed');
    }
  }

  async indexData(index: SearchIndexType, id: string, body: object) {
    try {
      const response = await this.elasticsearchService.index({
        index,
        id,
        body,
      });
      console.log('Indexing response:', response);
      return response;
    } catch (error) {
      console.error(error);
      throw new Error('Indexing failed');
    }
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
