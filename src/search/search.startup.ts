import { Injectable, OnModuleInit } from '@nestjs/common';
import { SearchService } from './search.service';

@Injectable()
export class SearchStartupService implements OnModuleInit {
  constructor(private readonly elasticsearchService: SearchService) {}

  async onModuleInit() {
    await this.elasticsearchService.createMessageIndex();
  }
}
