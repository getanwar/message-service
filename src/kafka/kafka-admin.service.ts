import { Injectable, OnModuleInit } from '@nestjs/common';
import { Admin, Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaAdminService implements OnModuleInit {
  private readonly kafkaAdmin: Admin;

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get<string[]>('kafka.brokers');
    if (!brokers || !brokers.length) {
      throw new Error('Kafka brokers are not defined in configuration');
    }
    const kafka = new Kafka({
      brokers,
      clientId: this.configService.get('kafka.clientId'),
    });

    this.kafkaAdmin = kafka.admin();
  }

  async onModuleInit() {
    await this.kafkaAdmin.connect();
    await this.ensureTopics('message.created', 3);
  }

  async ensureTopics(topicName: string, partitionCount: number) {
    const metadata = await this.kafkaAdmin.fetchTopicMetadata({
      topics: [topicName],
    });
    const topic = metadata.topics.find((t) => t.name === topicName);
    console.log('Topic partitions:', topic?.partitions);

    if (!topic) {
      await this.kafkaAdmin.createTopics({
        topics: [
          {
            topic: topicName,
            numPartitions: partitionCount,
            replicationFactor: 1,
          },
        ],
        waitForLeaders: true,
      });
      return;
    }

    if (topic?.partitions.length === partitionCount) {
      console.log(
        `Topic ${topicName} already has ${partitionCount} partitions`,
      );
      return;
    }

    if (topic && topic.partitions.length < partitionCount) {
      // Alter partition count
      await this.kafkaAdmin.createPartitions({
        topicPartitions: [{ topic: topicName, count: partitionCount }],
      });
    }
  }

  async onModuleDestroy() {
    await this.kafkaAdmin.disconnect();
  }
}
