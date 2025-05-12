import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Types } from 'mongoose';

import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import {
  GetMessagesByConversationQueryDto,
  GetMessagesByConversationParamsDto,
  SearchInConversationMessagesQueryDto,
  SearchInConversationMessagesParamsDto,
} from './conversations.dto';
import { MessageOutput } from '../common/common.types';

describe('ConversationsController', () => {
  let conversationsController: ConversationsController;
  let conversationsService: ConversationsService;

  // Create mocks
  const mockConversationsService = {
    getConversationMessages: jest.fn(),
    searchInConversationMessages: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
      ],
    }).compile();

    conversationsController = moduleRef.get<ConversationsController>(ConversationsController);
    conversationsService = moduleRef.get<ConversationsService>(ConversationsService);
  });

  it('should be defined', () => {
    expect(conversationsController).toBeDefined();
    expect(conversationsService).toBeDefined();
  });

  describe('getMessagesByConversation', () => {
    it('should return messages for a conversation', async () => {
      // Arrange
      const websiteId = '6821ec228aac53fbb1898e6b';
      const conversationId = '6821ec228aac53fbb1898e6c';

      const mockReq = {
        headers: {
          'x-website-id': websiteId,
        },
        get: jest.fn((name: string) => {
          if (name === 'x-website-id') return websiteId;
          return null;
        }),
      } as unknown as Request;

      const params: GetMessagesByConversationParamsDto = {
        conversationId,
      };

      const query: GetMessagesByConversationQueryDto = {
        page: 1,
        perPage: 20,
        sort: 'DESC',
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

      mockConversationsService.getConversationMessages.mockResolvedValue(expectedMessages);

      // Act
      const result = await conversationsController.getMessagesByConversation(
        mockReq,
        query,
        params,
      );

      // Assert
      expect(result).toEqual(expectedMessages);
      expect(conversationsService.getConversationMessages).toHaveBeenCalledWith({
        conversationId,
        websiteId,
        filter: {
          page: query.page,
          perPage: query.perPage,
          sort: query.sort,
        },
      });
    });

    it('should use default values when query params are missing', async () => {
      // Arrange
      const websiteId = '6821ec228aac53fbb1898e6b';
      const conversationId = '6821ec228aac53fbb1898e6c';

      const mockReq = {
        headers: {
          'x-website-id': websiteId,
        },
        get: jest.fn((name: string) => {
          if (name === 'x-website-id') return websiteId;
          return null;
        }),
      } as unknown as Request;

      const params: GetMessagesByConversationParamsDto = {
        conversationId,
      };

      // Empty query object to test defaults
      const query = {} as GetMessagesByConversationQueryDto;

      const expectedMessages: MessageOutput[] = [
        {
          id: new Types.ObjectId().toString(),
          content: 'Test message',
          timestamp: new Date(),
          conversationId,
        },
      ];

      mockConversationsService.getConversationMessages.mockResolvedValue(expectedMessages);

      // Act
      const result = await conversationsController.getMessagesByConversation(
        mockReq,
        query,
        params,
      );

      // Assert
      expect(result).toEqual(expectedMessages);
      expect(conversationsService.getConversationMessages).toHaveBeenCalledWith({
        conversationId,
        websiteId,
        filter: {
          page: 1, // default value
          perPage: 10, // default value
          sort: 'ASC', // default value
        },
      });
    });

    it('should throw an error when website ID is missing', async () => {
      // Arrange
      const conversationId = '6821ec228aac53fbb1898e6c';

      const mockReq = {
        headers: {},
        get: jest.fn(() => undefined),
      } as unknown as Request;

      const params: GetMessagesByConversationParamsDto = {
        conversationId,
      };

      const query: GetMessagesByConversationQueryDto = {
        page: 1,
        perPage: 20,
        sort: 'DESC',
      };

      // Act & Assert
      try {
        await conversationsController.getMessagesByConversation(mockReq, query, params);
        // If we reach this point, the test should fail
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error.message).toBe('Missing x-website-id header');
      }
      
      expect(conversationsService.getConversationMessages).not.toHaveBeenCalled();
    });
  });

  describe('searchInConversationMessages', () => {
    it('should search messages in a conversation', async () => {
      // Arrange
      const websiteId = '6821ec228aac53fbb1898e6b';
      const conversationId = '6821ec228aac53fbb1898e6c';
      const searchTerm = 'hello';

      const mockReq = {
        headers: {
          'x-website-id': websiteId,
        },
        get: jest.fn((name: string) => {
          if (name === 'x-website-id') return websiteId;
          return null;
        }),
      } as unknown as Request;

      const params: SearchInConversationMessagesParamsDto = {
        conversationId,
      };

      const query: SearchInConversationMessagesQueryDto = {
        q: searchTerm,
        page: 1,
        perPage: 20,
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

      mockConversationsService.searchInConversationMessages.mockResolvedValue(expectedMessages);

      // Act
      const result = await conversationsController.searchInConversationMessages(
        mockReq,
        query,
        params,
      );

      // Assert
      expect(result).toEqual(expectedMessages);
      expect(conversationsService.searchInConversationMessages).toHaveBeenCalledWith({
        conversationId,
        websiteId,
        search: searchTerm,
        filter: {
          page: Number(query.page),
          perPage: Number(query.perPage),
        },
      });
    });

    it('should use default values for pagination when not provided', async () => {
      // Arrange
      const websiteId = '6821ec228aac53fbb1898e6b';
      const conversationId = '6821ec228aac53fbb1898e6c';
      const searchTerm = 'hello';

      const mockReq = {
        headers: {
          'x-website-id': websiteId,
        },
        get: jest.fn((name: string) => {
          if (name === 'x-website-id') return websiteId;
          return null;
        }),
      } as unknown as Request;

      const params: SearchInConversationMessagesParamsDto = {
        conversationId,
      };

      // Only provide search term to test defaults for pagination
      const query = { 
        q: searchTerm 
      } as SearchInConversationMessagesQueryDto;

      const expectedMessages: MessageOutput[] = [
        {
          id: new Types.ObjectId().toString(),
          content: 'Hello there!',
          timestamp: new Date(),
          conversationId,
        },
      ];

      mockConversationsService.searchInConversationMessages.mockResolvedValue(expectedMessages);

      // Act
      const result = await conversationsController.searchInConversationMessages(
        mockReq,
        query,
        params,
      );

      // Assert
      expect(result).toEqual(expectedMessages);
      expect(conversationsService.searchInConversationMessages).toHaveBeenCalledWith({
        conversationId,
        websiteId,
        search: searchTerm,
        filter: {
          page: 1, // default value
          perPage: 10, // default value
        },
      });
    });

    it('should throw an error when website ID is missing', async () => {
      // Arrange
      const conversationId = '6821ec228aac53fbb1898e6c';
      const searchTerm = 'hello';

      const mockReq = {
        headers: {},
        get: jest.fn(() => undefined),
      } as unknown as Request;

      const params: SearchInConversationMessagesParamsDto = {
        conversationId,
      };

      const query: SearchInConversationMessagesQueryDto = {
        q: searchTerm,
        page: 1,
        perPage: 20,
      };

      // Act & Assert
      try {
        await conversationsController.searchInConversationMessages(mockReq, query, params);
        // If we reach this point, the test should fail
        fail('Expected method to throw an error');
      } catch (error) {
        expect(error.message).toBe('Missing x-website-id header');
      }
      
      expect(conversationsService.searchInConversationMessages).not.toHaveBeenCalled();
    });
  });
});
