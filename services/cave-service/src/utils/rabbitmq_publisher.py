import asyncio
import json
import logging
from typing import Dict, Any
import aio_pika
from aio_pika import connect_robust, ExchangeType
from src.config.settings import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)


class RabbitMQPublisher:
    """Publisher for sending cave-related events to RabbitMQ"""

    def __init__(self):
        self.connection: aio_pika.Connection = None
        self.channel: aio_pika.Channel = None

    async def connect(self):
        """Connect to RabbitMQ"""
        rabbitmq_url = getattr(settings, 'rabbitmq_url', 'amqp://admin:admin123@rabbitmq.default.svc.cluster.local:5672')
        logger.info(f"Connecting to RabbitMQ for publishing: {rabbitmq_url.replace(rabbitmq_url.split('@')[0] if '@' in rabbitmq_url else rabbitmq_url, '***:***@')}")

        self.connection = await connect_robust(rabbitmq_url)
        self.channel = await self.connection.channel()

        # Declare exchange
        self.exchange = await self.channel.declare_exchange(
            'cave.events',
            ExchangeType.TOPIC,
            durable=True
        )

        logger.info("RabbitMQ publisher connected")

    async def publish_cave_deleted(self, cave_id: int, cave_name: str, owner_email: str, media_file_ids: list[int] = None) -> None:
        """Publish cave deletion event"""
        if not self.connection or not self.channel:
            await self.connect()

        event_data = {
            'event': 'cave.deleted',
            'caveId': cave_id,
            'caveName': cave_name,
            'ownerEmail': owner_email,
            'timestamp': asyncio.get_event_loop().time()
        }

        if media_file_ids:
            event_data['mediaFileIds'] = media_file_ids

        message_body = json.dumps(event_data).encode()

        await self.exchange.publish(
            aio_pika.Message(body=message_body),
            routing_key='cave.deleted'
        )

        logger.info(f"Published cave.deleted event for cave {cave_id} ({cave_name})")

    async def close(self):
        """Close the connection"""
        if self.connection:
            await self.connection.close()
            logger.info("Closed RabbitMQ publisher connection")


# Global publisher instance
publisher = RabbitMQPublisher()
