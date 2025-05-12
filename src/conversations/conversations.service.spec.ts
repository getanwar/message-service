import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ConversationsService } from './conversations.service';
import { MessagesService } from '../messages/messages.service';
import { SearchService } from '../search/search.service';
import {
  GetConversationMessagesInput,
  SearchInConversationMessagesInput,
  MessageOutput,
} from '../common/common.types';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let messagesService: MessagesService;
  let searchService: SearchService;

  // Create mocks
  const mockMessagesService = {
    getConversationMessages: jest.fn(),
  };

  const mockSearchService = {
    searchInConversationMessages: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    messagesService = module.get<MessagesService>(MessagesService);
    searchService = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(messagesService).toBeDefined();
    expect(searchService).toBeDefined();
  });

  describe('getConversationMessages', () => {
    it('should return messages for a conversation', async () => {
      // Arrange
      const websiteId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();

      const input: GetConversationMessagesInput = {
        websiteId,
        conversationId,
        filter: {
          page: 1,
          perPage: 20,
          sort: 'DESC',
        },
      };

      const expectedMessages: MessageOutput[] = [
        {
          id: new Types.ObjectId().toString(),
          content: 'Hello there!',
          timestamp: new Date(),
          conversationId,
        },
        {
          id: new Types.ObjectId().toString(),
          content: 'How are you?',
          timestamp: new Date(),
          conversationId,
        },
      ];

      mockMessagesService.getConversationMessages.mockResolvedValue(
        expectedMessages,
      );

      // Act
      const result = await service.getConversationMessages(input);

      // Assert
      expect(result).toEqual(expectedMessages);
      expect(messagesService.getConversationMessages).toHaveBeenCalledWith(
        input,
      );
    });

    it('should return an empty array when no messages are found', async () => {
      // Arrange
      const input: GetConversationMessagesInput = {
        websiteId: new Types.ObjectId().toString(),
        conversationId: new Types.ObjectId().toString(),
        filter: {
          page: 1,
          perPage: 20,
          sort: 'ASC',
        },
      };

      mockMessagesService.getConversationMessages.mockResolvedValue([]);

      // Act
      const result = await service.getConversationMessages(input);

      // Assert
      expect(result).toEqual([]);
      expect(messagesService.getConversationMessages).toHaveBeenCalledWith(
        input,
      );
    });

    it('should handle errors when getting conversation messages', async () => {
      // Arrange
      const input: GetConversationMessagesInput = {
        websiteId: new Types.ObjectId().toString(),
        conversationId: new Types.ObjectId().toString(),
        filter: {
          page: 1,
          perPage: 10,
          sort: 'DESC',
        },
      };

      const errorMessage = 'Failed to get conversation messages';
      mockMessagesService.getConversationMessages.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(service.getConversationMessages(input)).rejects.toThrow(
        errorMessage,
      );
      expect(messagesService.getConversationMessages).toHaveBeenCalledWith(
        input,
      );
    });
  });

  describe('searchInConversationMessages', () => {
    it('should search messages in a conversation', async () => {
      // Arrange
      const websiteId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();

      const input: SearchInConversationMessagesInput = {
        websiteId,
        conversationId,
        search: 'hello',
        filter: {
          page: 1,
          perPage: 20,
        },
      };

      const expectedMessages: MessageOutput[] = [
        {
          id: new Types.ObjectId().toString(),
          content: 'Hello there!',
          timestamp: new Date(),
          conversationId,
        },
        {
          id: new Types.ObjectId().toString(),
          content: 'Hello world',
          timestamp: new Date(),
          conversationId,
        },
      ];

      mockSearchService.searchInConversationMessages.mockResolvedValue(
        expectedMessages,
      );

      // Act
      const result = await service.searchInConversationMessages(input);

      // Assert
      expect(result).toEqual(expectedMessages);
      expect(searchService.searchInConversationMessages).toHaveBeenCalledWith(
        input,
      );
    });

    it('should return an empty array when no search results are found', async () => {
      // Arrange
      const input: SearchInConversationMessagesInput = {
        websiteId: new Types.ObjectId().toString(),
        conversationId: new Types.ObjectId().toString(),
        search: 'nonexistent',
        filter: {
          page: 1,
          perPage: 20,
        },
      };

      mockSearchService.searchInConversationMessages.mockResolvedValue([]);

      // Act
      const result = await service.searchInConversationMessages(input);

      // Assert
      expect(result).toEqual([]);
      expect(searchService.searchInConversationMessages).toHaveBeenCalledWith(
        input,
      );
    });

    it('should handle errors when searching in conversation messages', async () => {
      // Arrange
      const input: SearchInConversationMessagesInput = {
        websiteId: new Types.ObjectId().toString(),
        conversationId: new Types.ObjectId().toString(),
        search: 'hello',
        filter: {
          page: 1,
          perPage: 10,
        },
      };

      const errorMessage = 'Failed to search conversation messages';
      mockSearchService.searchInConversationMessages.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(service.searchInConversationMessages(input)).rejects.toThrow(
        errorMessage,
      );
      expect(searchService.searchInConversationMessages).toHaveBeenCalledWith(
        input,
      );
    });
  });
});
