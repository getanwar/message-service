import { Request } from 'express';
import { Body, Controller, Post, Req } from '@nestjs/common';

import { getWebsiteId } from '../common/helpers';
import { MessagesService } from './messages.service';
import { CreateMessageInputDto, MongoMessageOutputDto } from './messages.dto';

@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() body: CreateMessageInputDto,
  ): Promise<MongoMessageOutputDto> {
    const websiteId = getWebsiteId(req);
    const message = await this.messagesService.create({ ...body, websiteId });

    return message;
  }
}
