import { Request } from 'express';
import { Controller, Get, Param, Query, Req } from '@nestjs/common';

import {
  GetMessagesByConversationQueryDto,
  GetMessagesByConversationParamsDto,
  SearchInConversationMessagesQueryDto,
  SearchInConversationMessagesParamsDto,
} from './conversations.dto';
import { getWebsiteId } from '../common/helpers';
import { MessageOutput } from '../common/common.types';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private conversationService: ConversationsService) {}

  @Get(':conversationId/messages')
  getMessagesByConversation(
    @Req() req: Request,
    @Query() query: GetMessagesByConversationQueryDto,
    @Param() params: GetMessagesByConversationParamsDto,
  ): Promise<MessageOutput[]> {
    const { conversationId } = params;
    const websiteId = getWebsiteId(req);
    const { page, perPage, sort } = query;
    const filter = {
      page: page || 1,
      sort: sort || 'ASC',
      perPage: perPage || 10,
    };
    return this.conversationService.getConversationMessages({
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
  ): Promise<MessageOutput[]> {
    const { conversationId } = params;
    const websiteId = getWebsiteId(req);
    const { q: search, page = 1, perPage = 10 } = query;

    return await this.conversationService.searchInConversationMessages({
      conversationId,
      websiteId,
      search,
      filter: {
        perPage: Number(perPage),
        page: Number(page),
      },
    });
  }
}
