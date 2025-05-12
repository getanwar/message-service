import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { KafkaModule } from '../kafka/kafka.module';
import { MessagesService } from './messages.service';
import { MessagesConsumer } from './messages.consumer';
import { MessagesProducer } from './messages.producer';
import { SearchModule } from '../search/search.module';
import { MessagesController } from './messages.controller';
import { Message, MessageSchema } from './messages.schema';
import { MessagesRepository } from './messages.repository';

@Module({
  imports: [
    KafkaModule,
    SearchModule,
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  controllers: [MessagesController, MessagesConsumer],
  providers: [MessagesRepository, MessagesService, MessagesProducer],
  exports: [MessagesService],
})
export class MessagesModule {}
