type MessagesFiler = {
  page: number;
  perPage: number;
  sort: 'ASC' | 'DESC';
};

type ConversationMessagesType = {
  websiteId: string;
  conversationId: string;
};

export type GetConversationMessagesInput = ConversationMessagesType & {
  filter: MessagesFiler;
};

export type SearchInConversationMessagesInput = ConversationMessagesType & {
  search: string;
} & {
  filter: Omit<MessagesFiler, 'sort'>;
};

export type MessageOutput = {
  id: string;
  content: string;
  timestamp: Date;
  conversationId: string;
};

export type SearchMessageData = {
  id: string;
  content: string;
  timestamp: Date;
  websiteId: string;
  conversationId: string;
};
