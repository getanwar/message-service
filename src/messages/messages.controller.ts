import { Request } from 'express';
import { Body, Controller, Post, Req } from '@nestjs/common';

import { getWebsiteId } from '../lib/helpers';
import { MessagesService } from './messages.service';
import { MessagesProducer } from './messages.producer';
import { CreateMessageInputDto, MongoMessageOutputDto } from './messages.dto';

@Controller('messages')
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private messageProducer: MessagesProducer,
  ) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() body: CreateMessageInputDto,
  ): Promise<MongoMessageOutputDto> {
    const websiteId = getWebsiteId(req);
    const message = await this.messagesService.create({ ...body, websiteId });

    if (message) {
      this.messageProducer.publishMessageCreated({
        id: message.id,
        content: message.content,
        timestamp: message.timestamp,
        websiteId: message.websiteId,
        conversationId: message.conversationId,
      });
    }

    return message;
  }
}
