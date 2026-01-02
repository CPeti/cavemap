const amqp = require('amqplib');

class RabbitMQPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@rabbitmq.default.svc.cluster.local:5672';
      console.log('Connecting to RabbitMQ:', rabbitmqUrl.replace(/:[^:]+@/, ':***@'));

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;

      console.log('Connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async publishMessage(exchange, routingKey, message) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Ensure exchange exists
      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      // Publish message
      const success = this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      if (success) {
        console.log(`Message published to ${exchange}:${routingKey}`, message);
      } else {
        console.warn(`Failed to publish message to ${exchange}:${routingKey}`);
      }

      return success;
    } catch (error) {
      console.error('Error publishing message:', error);
      // Don't throw error to avoid breaking the main flow
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}

// Singleton instance
const rabbitMQPublisher = new RabbitMQPublisher();

// Graceful shutdown
process.on('SIGINT', async () => {
  await rabbitMQPublisher.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await rabbitMQPublisher.close();
  process.exit(0);
});

module.exports = rabbitMQPublisher;
