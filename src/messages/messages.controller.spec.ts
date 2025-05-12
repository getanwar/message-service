import { Types } from 'mongoose';
import { Request } from 'express';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { Message } from './messages.schema';
import { KafkaService } from '../kafka/kafka.service';
import { SearchService } from '../search/search.service';

describe('MessageController', () => {
  let messagesController: MessagesController;
  let messagesService: MessagesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        MessagesRepository,
        MessagesService,
        {
          provide: getModelToken(Message.name),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: SearchService,
          useValue: {
            indexMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    messagesService = moduleRef.get(MessagesService);
    messagesController = moduleRef.get(MessagesController);
  });

  describe('create', () => {
    it('should create new message and return it', async () => {
      const result = {
        id: '6821ec228aac53fbb1898e6b',
        content: 'test',
        senderId: '6821ec228aac53fbb1898e6b',
        conversationId: '6821ec228aac53fbb1898e6b',
        timestamp: new Date(),
        websiteId: '6821ec228aac53fbb1898e6b',
        _id: new Types.ObjectId(),
        __v: 0,
      };
      jest
        .spyOn(messagesService, 'create')
        .mockImplementation(() => Promise.resolve(result));

      const messageInput = {
        conversationId: 'test',
        senderId: 'test',
        content: 'test',
      };
      // Mock request object with a method to get websiteId
      const mockReq = {
        headers: {
          'x-website-id': '6821ec228aac53fbb1898e6b',
        },
        get: jest.fn((name: string) => {
          if (name === 'x-website-id') return '6821ec228aac53fbb1898e6b';
          return null;
        }),
      } as unknown as Request;
      expect(await messagesController.create(mockReq, messageInput)).toBe(
        result,
      );
    });
  });
});
