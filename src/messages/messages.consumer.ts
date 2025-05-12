import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SearchMessageData } from './messages.types';
import { SearchService } from 'src/search/search.service';

@Controller()
export class MessagesConsumer {
  constructor(private readonly searchService: SearchService) {}

  @MessagePattern('message.created')
  async handleMessageCreated(@Payload() message: SearchMessageData) {
    await this.searchService.indexData('messages', message.id, message);
  }
}
