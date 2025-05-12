import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { SearchService } from '../search/search.service';
import { KafkaService } from '../kafka/kafka.service';
import { CreateMessageInput } from './messages.types';
import { MongoMessageOutputDto } from './messages.dto';
import { Types } from 'mongoose';
import { GetConversationMessagesInput } from '../common/common.types';

describe('MessagesService', () => {
  let service: MessagesService;
  let messagesRepository: MessagesRepository;
  let searchService: SearchService;
  let kafkaService: KafkaService;

  // Create mocks
  const mockMessagesRepository = {
    create: jest.fn(),
    getConversationMessages: jest.fn(),
  };

  const mockSearchService = {
    indexMessage: jest.fn(),
  };

  const mockKafkaService = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: MessagesRepository,
          useValue: mockMessagesRepository,
        },
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    messagesRepository = module.get<MessagesRepository>(MessagesRepository);
    searchService = module.get<SearchService>(SearchService);
    kafkaService = module.get<KafkaService>(KafkaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(messagesRepository).toBeDefined();
    expect(searchService).toBeDefined();
    expect(kafkaService).toBeDefined();
  });

  describe('create', () => {
    it('should create a message and emit a kafka event', async () => {
      // Arrange
      const messageInput: CreateMessageInput = {
        content: 'Hello, world!',
        senderId: new Types.ObjectId().toString(),
        conversationId: new Types.ObjectId().toString(),
        websiteId: new Types.ObjectId().toString(),
      };

      const createdMessage: MongoMessageOutputDto = {
        id: new Types.ObjectId().toString(),
        content: messageInput.content,
        senderId: messageInput.senderId,
        conversationId: messageInput.conversationId,
        websiteId: messageInput.websiteId,
        timestamp: new Date(),
        _id: new Types.ObjectId(),
        __v: 0,
      };

      mockMessagesRepository.create.mockResolvedValue(createdMessage);

      // Act
      const result = await service.create(messageInput);

      // Assert
      expect(result).toBe(createdMessage);
      expect(messagesRepository.create).toHaveBeenCalledWith(messageInput);
      expect(kafkaService.emit).toHaveBeenCalledWith('message.created', {
        id: createdMessage.id,
        content: createdMessage.content,
        timestamp: createdMessage.timestamp,
        websiteId: createdMessage.websiteId,
        conversationId: createdMessage.conversationId,
      });
    });

    it('should handle errors when creating a message', async () => {
      // Arrange
      const messageInput: CreateMessageInput = {
        content: 'Hello, world!',
        senderId: new Types.ObjectId().toString(),
        conversationId: new Types.ObjectId().toString(),
        websiteId: new Types.ObjectId().toString(),
      };

      const errorMessage = 'Failed to create message';
      mockMessagesRepository.create.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.create(messageInput)).rejects.toThrow(errorMessage);
      expect(messagesRepository.create).toHaveBeenCalledWith(messageInput);
      expect(kafkaService.emit).not.toHaveBeenCalled();
    });
  });

  describe('getConversationMessages', () => {
    it('should get messages for a conversation', async () => {
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

      const expectedMessages: MongoMessageOutputDto[] = [
        {
          id: new Types.ObjectId().toString(),
          content: 'Hello there!',
          senderId: new Types.ObjectId().toString(),
          conversationId,
          websiteId,
          timestamp: new Date(),
          _id: new Types.ObjectId(),
          __v: 0,
        },
        {
          id: new Types.ObjectId().toString(),
          content: 'How are you?',
          senderId: new Types.ObjectId().toString(),
          conversationId,
          websiteId,
          timestamp: new Date(),
          _id: new Types.ObjectId(),
          __v: 0,
        },
      ];

      mockMessagesRepository.getConversationMessages.mockResolvedValue(
        expectedMessages,
      );

      // Act
      const result = await service.getConversationMessages(input);

      // Assert
      expect(result).toEqual(expectedMessages);
      expect(messagesRepository.getConversationMessages).toHaveBeenCalledWith(
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

      mockMessagesRepository.getConversationMessages.mockResolvedValue([]);

      // Act
      const result = await service.getConversationMessages(input);

      // Assert
      expect(result).toEqual([]);
      expect(messagesRepository.getConversationMessages).toHaveBeenCalledWith(
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
      mockMessagesRepository.getConversationMessages.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(service.getConversationMessages(input)).rejects.toThrow(
        errorMessage,
      );
      expect(messagesRepository.getConversationMessages).toHaveBeenCalledWith(
        input,
      );
    });
  });

  describe('handleMessageCreated', () => {
    it('should index a message in the search service', async () => {
      // Arrange
      const messageId = new Types.ObjectId().toString();
      const websiteId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();
      const timestamp = new Date();

      const messageCreatedEvent = {
        id: messageId,
        content: 'Hello from Kafka!',
        timestamp,
        websiteId,
        conversationId,
      };

      mockSearchService.indexMessage.mockResolvedValue({
        result: 'created',
        statusCode: 201,
      });

      // Act
      await service.handleMessageCreated(messageCreatedEvent);

      // Assert
      expect(searchService.indexMessage).toHaveBeenCalledWith(
        messageId,
        messageCreatedEvent,
      );
    });

    it('should handle errors when indexing a message', async () => {
      // Arrange
      const messageId = new Types.ObjectId().toString();
      const messageCreatedEvent = {
        id: messageId,
        content: 'Hello from Kafka!',
        timestamp: new Date(),
        websiteId: new Types.ObjectId().toString(),
        conversationId: new Types.ObjectId().toString(),
      };

      const errorMessage = 'Failed to index message';
      mockSearchService.indexMessage.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        service.handleMessageCreated(messageCreatedEvent),
      ).rejects.toThrow(errorMessage);
      expect(searchService.indexMessage).toHaveBeenCalledWith(
        messageId,
        messageCreatedEvent,
      );
    });
  });
});
