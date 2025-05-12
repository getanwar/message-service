type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  websiteId: string;
  metadata?: Record<string, any>;
};

export type CreateMessageInput = Pick<
  Message,
  'content' | 'senderId' | 'conversationId' | 'websiteId'
>;
