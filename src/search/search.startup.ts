import { Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchRepository } from './search.repository';

@Injectable()
export class SearchStartupService implements OnModuleInit {
  constructor(
    private readonly elasticSearchRepository: ElasticsearchRepository,
  ) {}

  async onModuleInit() {
    await this.elasticSearchRepository.createMessageIndex();
  }
}
