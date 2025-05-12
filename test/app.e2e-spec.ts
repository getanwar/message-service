import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Types } from 'mongoose';
import { AppModule } from './../src/app.module';
import { Message } from '../src/messages/messages.schema';
import { getModelToken } from '@nestjs/mongoose';
import { KafkaService } from '../src/kafka/kafka.service';
import { KafkaAdminService } from '../src/kafka/kafka-admin.service';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';

describe('Messages API (e2e)', () => {
  let app: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;
  let messageModel: any;

  // Create test data
  const websiteId = new Types.ObjectId().toString();
  const conversationId = new Types.ObjectId().toString();
  const senderId = new Types.ObjectId().toString();
  const testMessages: any[] = [];

  beforeAll(async () => {
    // Create an in-memory MongoDB instance for testing
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();
    process.env.MONGO_URI = mongoUri;

    // Mock other environment variables needed by the application
    process.env.KAFKA_BROKERS = '';
    process.env.KAFKA_CLIENT_ID = 'test-client';
    process.env.KAFKA_GROUP_ID = 'test-group';
    process.env.ELASTICSEARCH_NODE = 'http://localhost:9200';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('MESSAGES_SERVICE')
      .useValue({
        emit: jest
          .fn()
          .mockImplementation(() => ({ toPromise: () => Promise.resolve() })),
        connect: jest.fn(),
        close: jest.fn(),
      })
      // Mock KafkaService
      .overrideProvider(KafkaService)
      .useValue({
        emit: jest.fn().mockImplementation(() => Promise.resolve()),
        onModuleInit: jest.fn(),
      })
      // Mock KafkaAdminService
      .overrideProvider(KafkaAdminService)
      .useValue({
        onModuleInit: jest.fn(),
        ensureTopics: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      })
      // Mock ElasticsearchService to prevent connection issues
      .overrideProvider(NestElasticsearchService)
      .useValue({
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
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    // Get the message model to directly work with the database
    messageModel = moduleFixture.get(getModelToken(Message.name));

    // Clear the collection before each test
    await messageModel.deleteMany({});

    // Create some test messages - use the same conversation ID for all messages
    // so they can be retrieved in the tests
    for (let i = 1; i <= 5; i++) {
      const message = await messageModel.create({
        content: `Test message ${i}`,
        senderId: senderId,
        conversationId: conversationId,
        websiteId: websiteId,
        timestamp: new Date(2023, 0, i), // Ordered dates for sorting tests
      });
      testMessages.push(message);
    }
  });

  afterEach(async () => {
    await messageModel.deleteMany({});
    testMessages.length = 0;
  });
  afterAll(async () => {
    try {
      // Close all connections and services
      if (app) {
        // Close elasticsearch connection
        try {
          const elasticsearchService = app.get(NestElasticsearchService);
          if (elasticsearchService) {
            await elasticsearchService.close();
          }
        } catch (e) {
          console.warn('Error closing Elasticsearch:', e.message);
        }

        // Let NestJS handle the cleanup of its providers through app.close()
        await app.close();
      }
    } finally {
      // Always stop MongoDB memory server as the last step
      if (mongoMemoryServer) {
        await mongoMemoryServer.stop();
      }
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

    it('should return 400 when websiteId header is missing', async () => {
      const payload = {
        content: 'Hello, this is a test message',
        senderId,
        conversationId,
      };

      await request(app.getHttpServer())
        .post('/api/messages')
        .send(payload)
        .expect(400);
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
      const timestamps = response.body.map((msg) =>
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
      const timestamps = response.body.map((msg) =>
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
      const page1Ids = page1Response.body.map((msg) => msg.id);
      const page2Ids = page2Response.body.map((msg) => msg.id);

      // Check that no message appears on both pages
      const intersection = page1Ids.filter((id) => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });
  });

  describe('GET /api/conversations/:conversationId/messages/search', () => {
    // Note: We'll need to mock the Elasticsearch service for this to work properly
    it('should return 400 if search query is missing', async () => {
      await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages/search`)
        .set('x-website-id', websiteId)
        .expect(400);
    });

    it('should accept valid search parameters', async () => {
      // Note: This will likely return empty results since we're not properly setting up Elasticsearch
      // but we can at least verify the API accepts the request
      await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages/search?q=test`)
        .set('x-website-id', websiteId)
        .expect(200);
    });
  });
});
