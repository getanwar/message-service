export default () => ({
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(','),
    clientId: process.env.KAFKA_CLIENT_ID,
    groupId: process.env.KAFKA_GROUP_ID,
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE,
  },
  mongo: {
    uri: process.env.MONGO_URI,
  },
});
