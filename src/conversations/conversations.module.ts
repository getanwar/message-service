import { Module } from '@nestjs/common';

import { SearchModule } from '../search/search.module';
import { MessagesModule } from '../messages/messages.module';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [MessagesModule, SearchModule],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
