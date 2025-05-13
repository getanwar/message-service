import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../src/messages/messages.schema';
import { getModelToken } from '@nestjs/mongoose';
import { MessagesController } from '../src/messages/messages.controller';
import { MessagesService } from '../src/messages/messages.service';
import { MessagesRepository } from '../src/messages/messages.repository';
import { SearchService } from '../src/search/search.service';
import { KafkaService } from '../src/kafka/kafka.service';
import { ConversationsController } from '../src/conversations/conversations.controller';
import { ConversationsService } from '../src/conversations/conversations.service';
import { ConfigModule } from '@nestjs/config';
import config from '../src/config/config';

// Create test utility mocks
const mockKafkaService = {
  emit: jest.fn().mockResolvedValue({}),
  onModuleInit: jest.fn(),
};

const mockElasticsearchService = {
  indices: {
    exists: jest.fn().mockResolvedValue(true),
    create: jest.fn().mockResolvedValue({}),
  },
  index: jest.fn().mockResolvedValue({}),
  search: jest.fn().mockResolvedValue({
    hits: {
      hits: [],
      total: { value: 0 },
    },
  }),
  close: jest.fn().mockResolvedValue(undefined),
};

const mockSearchService = {
  indexMessage: jest.fn().mockResolvedValue({}),
  searchMessages: jest.fn().mockResolvedValue({
    hits: [],
    total: 0,
  }),
  searchInConversationMessages: jest.fn().mockResolvedValue([]),
};

describe('Messages API (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let messageModel: any;

  // Create test data
  const websiteId = new Types.ObjectId().toString();
  const conversationId = new Types.ObjectId().toString();
  const senderId = new Types.ObjectId().toString();
  const testMessages: any[] = [];

  // Set test timeout
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Create a minimal test module with everything mocked except the MongoDB connection
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: async () => ({
            uri: await mongoServer.getUri(),
          }),
        }),
        MongooseModule.forFeature([
          { name: Message.name, schema: MessageSchema },
        ]),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
      ],
      controllers: [MessagesController, ConversationsController],
      providers: [
        MessagesService,
        MessagesRepository,
        ConversationsService,
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
        {
          provide: 'MESSAGES_SERVICE',
          useValue: {
            emit: jest.fn().mockImplementation(() => ({
              toPromise: jest.fn().mockResolvedValue({}),
            })),
            connect: jest.fn(),
            close: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    // Get message model
    messageModel = moduleFixture.get(getModelToken(Message.name));

    // Clear database
    await messageModel.deleteMany({});
    testMessages.length = 0;

    // Create test messages
    for (let i = 1; i <= 5; i++) {
      const message = await messageModel.create({
        content: `Test message ${i}`,
        senderId,
        conversationId,
        websiteId,
        timestamp: new Date(2023, 0, i),
      });
      testMessages.push(message);
    }
  });

  afterEach(async () => {
    if (messageModel) {
      await messageModel.deleteMany({});
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/messages', () => {
    it('should create a new message', async () => {
      const payload = {
        content: 'Hello, this is a test message',
        senderId,
        conversationId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/messages')
        .set('x-website-id', websiteId)
        .send(payload)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.content).toBe(payload.content);
      expect(response.body.senderId).toBe(payload.senderId);
      expect(response.body.conversationId).toBe(payload.conversationId);
      expect(response.body.websiteId).toBe(websiteId);
      expect(response.body.id).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 400 when payload is invalid', async () => {
      const invalidPayload = {
        content: '', // Empty content
        senderId,
        conversationId,
      };

      await request(app.getHttpServer())
        .post('/api/messages')
        .set('x-website-id', websiteId)
        .send(invalidPayload)
        .expect(400);
    });

    it('should return error when websiteId header is missing', async () => {
      const payload = {
        content: 'Hello, this is a test message',
        senderId,
        conversationId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/messages')
        .send(payload);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(600);
    });
  });

  describe('GET /api/conversations/:conversationId/messages', () => {
    it('should return messages for a conversation with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages`)
        .set('x-website-id', websiteId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10); // Default perPage is 10
      expect(response.body[0].conversationId).toBe(conversationId);
    });

    it('should limit messages based on perPage param', async () => {
      const perPage = 2;

      const response = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages?perPage=${perPage}`)
        .set('x-website-id', websiteId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(perPage);
    });

    it('should sort messages in ASC order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages?sort=ASC`)
        .set('x-website-id', websiteId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if messages are sorted in ascending order by timestamp/id
      const timestamps = response.body.map((msg: any) =>
        new Date(msg.timestamp).getTime(),
      );
      const sorted = [...timestamps].sort((a, b) => a - b);
      expect(timestamps).toEqual(sorted);
    });

    it('should sort messages in DESC order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages?sort=DESC`)
        .set('x-website-id', websiteId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if messages are sorted in descending order by timestamp/id
      const timestamps = response.body.map((msg: any) =>
        new Date(msg.timestamp).getTime(),
      );
      const sorted = [...timestamps].sort((a, b) => b - a);
      expect(timestamps).toEqual(sorted);
    });

    it('should handle pagination correctly', async () => {
      // First page
      const page1Response = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages?page=1&perPage=2`)
        .set('x-website-id', websiteId)
        .expect(200);

      // Second page
      const page2Response = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages?page=2&perPage=2`)
        .set('x-website-id', websiteId)
        .expect(200);

      expect(page1Response.body.length).toBeLessThanOrEqual(2);
      expect(page2Response.body.length).toBeLessThanOrEqual(2);

      // Messages from page 1 and page 2 should be different
      const page1Ids = page1Response.body.map((msg: any) => msg.id);
      const page2Ids = page2Response.body.map((msg: any) => msg.id);

      // Check that no message appears on both pages
      const intersection = page1Ids.filter((id: string) =>
        page2Ids.includes(id),
      );
      expect(intersection.length).toBe(0);
    });
  });

  describe('GET /api/conversations/:conversationId/messages/search', () => {
    // Note: We're mocking the Elasticsearch service here
    it('should return 400 if search query is missing', async () => {
      await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages/search`)
        .set('x-website-id', websiteId)
        .expect(400);
    });

    it('should accept valid search parameters', async () => {
      await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages/search?q=test`)
        .set('x-website-id', websiteId)
        .expect(200);
    });
  });
});
