type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  websiteId: string;
  metadata?: Record<string, any>;
};

export type MessagesFiler = {
  page: number;
  perPage: number;
  sort: 'ASC' | 'DESC';
};

export type CreateMessageInput = Pick<
  Message,
  'content' | 'senderId' | 'conversationId' | 'websiteId'
>;

export type GetConversationMessagesInput = Pick<
  Message,
  'conversationId' | 'websiteId'
> & {
  filter: MessagesFiler;
};

export type SearchMessageData = Pick<
  Message,
  'id' | 'content' | 'timestamp' | 'conversationId' | 'websiteId'
>;
