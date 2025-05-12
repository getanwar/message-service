## API Documentation

Note: Since I haven't handled website and conversation creation in this service yet, you have to provide valid MongoDB ObjectIds for the `x-website-id` header, `conversationId` and `senderId`.
I have given a valid mongoDB ObjectId here to copy paste in Postman

```
681f5c8e1dd91fb590eb6384
```

_You don't have to use the ObjectId provided here, you can use any valid mongoDB ObjectId._

The tawk-messages-service exposes the following REST APIs:

### Messages

#### Create a new message

```
POST /api/messages
```

**Headers:**

- `x-website-id`: The website ID (required)

**Request Body:**

```json
{
  "content": "Hello, how can I help you today?",
  "senderId": "60d21b4667d0d8992e610c85",
  "conversationId": "60d21b4667d0d8992e610c86"
}
```

**Response:**

```json
{
  "id": "60d21b4667d0d8992e610c87",
  "content": "Hello, how can I help you today?",
  "senderId": "60d21b4667d0d8992e610c85",
  "conversationId": "60d21b4667d0d8992e610c86",
  "timestamp": "2023-07-15T14:30:00.000Z",
  "websiteId": "60d21b4667d0d8992e610c88"
}
```

### Conversations

#### Get messages from a conversation

```
GET /api/conversations/:conversationId/messages
```

**Headers:**

- `x-website-id`: The website ID (required)

**URL Parameters:**

- `conversationId`: The ID of the conversation

**Query Parameters:**

- `page`: Page number (default: 1)
- `perPage`: Results per page (default: 10)
- `sort`: Sort order, either 'ASC' or 'DESC' (default: 'ASC')

**Response:**

```json
[
  {
    "id": "60d21b4667d0d8992e610c87",
    "content": "Hello, how can I help you today?",
    "senderId": "60d21b4667d0d8992e610c85",
    "conversationId": "60d21b4667d0d8992e610c86",
    "timestamp": "2023-07-15T14:30:00.000Z"
  },
  {
    "id": "60d21b4667d0d8992e610c89",
    "content": "I have a question about my account",
    "senderId": "60d21b4667d0d8992e610c90",
    "conversationId": "60d21b4667d0d8992e610c86",
    "timestamp": "2023-07-15T14:31:00.000Z"
  }
]
```

#### Search messages within a conversation

```
GET /api/conversations/:conversationId/messages/search
```

**Headers:**

- `x-website-id`: The website ID (required)

**URL Parameters:**

- `conversationId`: The ID of the conversation

**Query Parameters:**

- `q`: Search query string
- `page`: Page number (default: 1)
- `perPage`: Results per page (default: 10)

**Response:**

```json
[
  {
    "id": "60d21b4667d0d8992e610c87",
    "content": "Hello, how can I help you today?",
    "senderId": "60d21b4667d0d8992e610c85",
    "conversationId": "60d21b4667d0d8992e610c86",
    "timestamp": "2023-07-15T14:30:00.000Z"
  }
]
```

## Using the Postman Collection

A Postman collection is included in the repository to help you test the API endpoints easily. The collection includes pre-configured requests for all available endpoints.

### Importing the Collection

1. Open Postman
2. Click on "Import" in the top-left corner
3. Select the `postman.json` file from this repository
4. You'll see a new collection named "Tawk Messages" in your Postman workspace

### Using the Collection

The collection includes the following pre-configured requests:

1. **Create Message**: Create a new message for a conversation
2. **Get Conversation Messages**: Retrieve messages from a specific conversation with pagination and sorting
3. **Search in Conversation**: Search messages within a conversation using text query

Each request is already set up with:
- The correct endpoint URL
- Required headers (`x-website-id`)
- Sample request body (for POST requests)
- Example query parameters

You may need to adjust the following values based on your setup:
- MongoDB ObjectIds for `websiteId`, `conversationId`, and `senderId`
- URL if not running the service on the default port (3000)

## Architecture Decisions

### Microservice Architecture

The tawk-messages-service is built as a standalone microservice focusing exclusively on messages and conversations. This separation of concerns allows for:

1. **Independent Scaling**: The message service can be scaled independently of other services based on its specific load requirements.
2. **Focused Development**: Teams can work on this service without impacting other parts of the system.
3. **Technology Specialization**: The service uses technologies optimized for chat messaging (MongoDB for storage, Elasticsearch for search, Kafka for event streaming).

### Technology Stack

1. **NestJS Framework**

   - Provides a robust, modular structure for building scalable server-side applications
   - Built-in support for dependency injection, making the code more maintainable and testable

2. **MongoDB**

   - Document-oriented database well-suited for storing chat messages
   - Efficient indexing capabilities for querying conversation histories
   - Schema flexibility allows for future extensions to message formats

3. **Kafka**

   - Used for event-driven communication between services
   - Enables real-time processing of message events
   - Provides reliable message delivery and fault tolerance

4. **Elasticsearch**
   - Powers the full-text search capabilities for messages
   - Enables efficient searching within conversations
   - Provides fast query responses for large volumes of message data

### Data Model

The primary entities in the service are:

1. **Message**
   - Core attributes: content, senderId, conversationId, websiteId, timestamp
   - Optional metadata field for extensibility
   - Indexed by websiteId and conversationId for efficient querying

### Event-Driven Design

The service employs an event-driven architecture:

1. When a new message is created, a `message.created` event is emitted to Kafka
2. This event is consumed by internal services (like the search service) to update indexes
3. Other external services can also consume these events to react to new messages

This approach:

- Decouples message creation from additional processing
- Enables asynchronous handling of side effects (like indexing)
- Improves system resilience by allowing components to process events at their own pace

### Multi-Tenancy Implementation

The service implements a multi-tenant architecture where each website represents a separate tenant:

1. **Header-Based Tenant Identification**: Every API request requires the `x-website-id` header to identify the tenant.
2. **Global Middleware Enforcement**: The `WebsiteHeaderMiddleware` validates the presence of the websiteId for all routes.
3. **Data Isolation**: All database queries are automatically scoped to the specified websiteId.
   - MongoDB indexes on the websiteId field enable efficient tenant-specific queries
   - Message schema includes websiteId as a required field with a dedicated index
4. **Search Partitioning**: Elasticsearch queries include websiteId in search terms to ensure tenant data isolation.
5. **Event Propagation**: The websiteId is included in all Kafka events, ensuring downstream services maintain tenant context.

This approach provides logical data isolation between tenants while using a shared infrastructure, optimizing resource usage without compromising security.

### Request Flow

1. Client sends a request to the API endpoints
2. The `WebsiteHeaderMiddleware` extracts and validates the website ID
3. The appropriate controller handles the request
4. The service layer processes the business logic
5. The repository layer interacts with the database
6. For mutations, events are emitted to Kafka
7. Response is returned to the client

## Running with Docker Compose

This application and all its dependencies can be run using Docker Compose, which will set up the following services:

- **messages-service**: The main NestJS application
- **mongodb**: Database for storing messages
- **mongo-express**: Web-based MongoDB admin interface
- **zookeeper**: Required for Kafka
- **kafka**: Message broker for event-driven communication
- **elasticsearch**: Search engine for full-text search capabilities

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

### Starting the Application

1. Clone the repository and navigate to the project directory:

```bash
git clone <repository-url>
cd tawk-messages-service
```

2. Start all services with Docker Compose:

```bash
docker-compose up
```

To run the services in the background (detached mode):

```bash
docker-compose up -d
```

3. Wait for all services to initialize (this might take a minute or two on first run)

### Accessing the Services

Once all services are running, you can access:

- **API**: http://localhost:3000/api
- **MongoDB Express Admin Interface**: http://localhost:8081
- **Elasticsearch**: http://localhost:9200

### Making API Requests

You can use the included Postman collection to make API requests to the containerized application. The API endpoints will be available at:

- Create Message: http://localhost:3000/api/messages
- Get Conversation Messages: http://localhost:3000/api/conversations/:conversationId/messages
- Search in Conversation: http://localhost:3000/api/conversations/:conversationId/messages/search

Remember to include the `x-website-id` header in all requests.

### Shutting Down

To stop all services:

```bash
docker-compose down
```

To stop all services and remove volumes (this will delete all data):

```bash
docker-compose down -v
```

## Testing

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# End-to-end tests
npm run test:e2e
```
