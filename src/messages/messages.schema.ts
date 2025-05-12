import mongoose, { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema()
export class Message {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId })
  websiteId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId })
  conversationId: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId })
  senderId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Date, required: true, default: Date.now })
  timestamp: Date;

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ websiteId: 1, conversationId: 1 });
MessageSchema.index({ websiteId: 1 });
