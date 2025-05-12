import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagesService } from './messages.service';
import { MessageCreatedEventDto } from './messages.dto';

@Controller()
export class MessagesConsumer {
  constructor(private readonly messagesService: MessagesService) {}

  @MessagePattern('message.created')
  async handleMessageCreated(@Payload() message: MessageCreatedEventDto) {
    await this.messagesService.handleMessageCreated(message);
  }
}
