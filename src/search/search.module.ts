import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';

import { SearchService } from './search.service';
import { SearchStartupService } from './search.startup';
import { ElasticsearchRepository } from './search.repository';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        node: configService.get<string>('elasticsearch.node'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SearchService, ElasticsearchRepository, SearchStartupService],
  exports: [SearchService],
})
export class SearchModule {}
