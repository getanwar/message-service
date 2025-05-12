import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';

import type { CreateMessageInput } from './messages.types';
import { Message } from './messages.schema';
import { MongoMessageOutputDto } from './messages.dto';
import { GetConversationMessagesInput } from '../common/common.types';

interface IMessagesRepository {
  create(message: CreateMessageInput): Promise<MongoMessageOutputDto>;
  getConversationMessages(
    input: GetConversationMessagesInput,
  ): Promise<MongoMessageOutputDto[]>;
}

export class MessagesRepository implements IMessagesRepository {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
  ) {}

  async create(message: CreateMessageInput) {
    const created = await this.messageModel.create(message);

    return plainToInstance(MongoMessageOutputDto, created.toObject());
  }

  async getConversationMessages(input: GetConversationMessagesInput) {
    const { page, perPage, sort } = input.filter;
    const limit = perPage;
    const skip = (page - 1) * perPage;
    const sortBy = sort === 'ASC' ? 1 : -1;

    const messages = await this.messageModel
      .find({
        websiteId: input.websiteId,
        conversationId: input.conversationId,
      })
      .sort({ _id: sortBy })
      .limit(limit)
      .skip(skip)
      .lean();

    return plainToInstance(MongoMessageOutputDto, messages);
  }
}
