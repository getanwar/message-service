import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { SearchService } from '../search/search.service';
import { KafkaService } from '../kafka/kafka.service';
import { CreateMessageInput } from './messages.types';
import { MongoMessageOutputDto } from './messages.dto';
import { Types } from 'mongoose';

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
});
