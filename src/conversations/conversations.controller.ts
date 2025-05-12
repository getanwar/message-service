import { Request } from 'express';
import { Controller, Get, Param, Query, Req } from '@nestjs/common';

import {
  GetMessagesByConversationQueryDto,
  GetMessagesByConversationParamsDto,
  SearchInConversationMessagesQueryDto,
  SearchInConversationMessagesParamsDto,
} from './conversations.dto';
import { getWebsiteId } from 'src/lib/helpers';
import { SearchService } from '../search/search.service';
import { MessagesService } from '../messages/messages.service';
import { MongoMessageOutputDto } from 'src/messages/messages.dto';
import { buildMessagesSearchQuery } from './conversations.helpers';
import type { SearchMessageData } from '../messages/messages.types';

@Controller('conversations')
export class ConversationsController {
  constructor(
    private searchService: SearchService,
    private messagesService: MessagesService,
  ) {}

  @Get(':conversationId/messages')
  getMessagesByConversation(
    @Req() req: Request,
    @Query() query: GetMessagesByConversationQueryDto,
    @Param() params: GetMessagesByConversationParamsDto,
  ): Promise<MongoMessageOutputDto[]> {
    const { conversationId } = params;
    const websiteId = getWebsiteId(req);
    const { page, perPage, sort } = query;
    const filter = {
      page: page || 1,
      sort: sort || 'ASC',
      perPage: perPage || 10,
    };
    return this.messagesService.getConversationMessages({
      conversationId,
      websiteId,
      filter,
    });
  }

  @Get(':conversationId/messages/search')
  async searchInConversationMessages(
    @Req() req: Request,
    @Query() query: SearchInConversationMessagesQueryDto,
    @Param() params: SearchInConversationMessagesParamsDto,
  ): Promise<SearchMessageData[]> {
    const { conversationId } = params;
    const websiteId = getWebsiteId(req);
    const { q: search, page = 1, perPage = 10 } = query;

    const response = await this.searchService.search<SearchMessageData>(
      'messages',
      {
        size: perPage,
        from: (page - 1) * perPage,
        query: buildMessagesSearchQuery({ search, websiteId, conversationId }),
      },
    );

    return response.map((res) => res.data);
  }
}
