import asyncio
import json
import logging
from typing import Optional, Dict, Any
import aio_pika
from aio_pika import connect_robust, ExchangeType
from src.config.settings import settings
from src.utils.cave_deletion_handler import CaveDeletionHandler

logger = logging.getLogger(__name__)


class MessageHandler:
    """Base class for message handlers"""

    async def handle(self, event_data: Dict[str, Any]) -> None:
        """Handle the message. Override in subclasses."""
        raise NotImplementedError("Subclasses must implement handle method")


class UserDeletionMessageHandler(MessageHandler):
    """Handler for user deletion events"""

    def __init__(self):
        self.deletion_handler = CaveDeletionHandler()

    async def handle(self, event_data: Dict[str, Any]) -> None:
        """Handle user deletion event by managing cave ownership"""
        user_email = event_data.get('email')
        user_id = event_data.get('userId')

        if not user_email:
            raise ValueError("User deletion event missing email field")
        await self.deletion_handler.handle_user_deletion(user_email, user_id)

class RabbitMQConsumer:
    def __init__(self):
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.consumer_tag: Optional[str] = None
        self.is_running = False
        self.message_handlers: Dict[str, MessageHandler] = {}

        # Register default message handlers
        self._register_handlers()

    def _register_handlers(self):
        """Register message handlers for different event types"""
        self.message_handlers['user.deleted'] = UserDeletionMessageHandler()

    def register_handler(self, event_type: str, handler: MessageHandler):
        """Register a handler for a specific event type"""
        self.message_handlers[event_type] = handler
        logger.info(f"Registered handler for event type: {event_type}")

    async def _handle_message(self, event_type: str, event_data: Dict[str, Any]) -> None:
        """Route message to appropriate handler"""
        handler = self.message_handlers.get(event_type)

        if not handler:
            logger.warning(f"No handler registered for event type: {event_type}")
            return

        await handler.handle(event_data)

    async def connect(self):
        """Connect to RabbitMQ"""
        try:
            rabbitmq_url = getattr(settings, 'rabbitmq_url', 'amqp://admin:admin123@rabbitmq.default.svc.cluster.local:5672')
            logger.info(f"Connecting to RabbitMQ: {rabbitmq_url.replace(rabbitmq_url.split('@')[0] if '@' in rabbitmq_url else rabbitmq_url, '***:***@')}")

            self.connection = await connect_robust(rabbitmq_url)
            self.channel = await self.connection.channel()

            # Declare exchange
            exchange = await self.channel.declare_exchange(
                'user.events',
                ExchangeType.TOPIC,
                durable=True
            )

            # Declare queue
            queue = await self.channel.declare_queue('', exclusive=True)

            # Bind queue to exchange with routing key
            await queue.bind(exchange, 'user.deleted')

            logger.info("RabbitMQ consumer connected and bound to user.events exchange")

            return queue

        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    async def start_consuming(self):
        """Start consuming messages"""
        try:
            queue = await self.connect()

            # Start consuming
            self.consumer_tag = await queue.consume(self._on_message)
            self.is_running = True

            logger.info("Started consuming user deletion messages")

        except Exception as e:
            logger.error(f"Failed to start consuming: {e}")
            raise

    async def _on_message(self, message: aio_pika.IncomingMessage):
        """Handle incoming messages"""
        async with message.process():
            try:
                # Parse message body
                body = message.body.decode()
                event_data = json.loads(body)

                event_type = event_data.get('event')
                if not event_type:
                    logger.error("Message missing 'event' field")
                    return

                # Log the received event
                self._log_event(event_data)

                # Route to appropriate handler
                try:
                    await self._handle_message(event_type, event_data)
                    print(f"✓ Successfully processed {event_type} event")
                    logger.info(f"Successfully processed {event_type} event")

                except Exception as e:
                    logger.error(f"Failed to process {event_type} event: {e}")
                    print(f"✗ Failed to process {event_type} event: {e}")

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse message body: {e}")
            except Exception as e:
                logger.error(f"Error processing message: {e}")

    def _log_event(self, event_data: Dict[str, Any]) -> None:
        """Log event details in a standardized format"""
        event_type = event_data.get('event', 'unknown')

        print("=" * 60)
        print(f"🎯 CAVE SERVICE - {event_type.upper().replace('.', ' ')} EVENT RECEIVED")
        print("=" * 60)

    async def stop_consuming(self):
        """Stop consuming messages"""
        try:
            if self.consumer_tag and self.channel:
                await self.channel.basic_cancel(self.consumer_tag)
                logger.info("Stopped consuming messages")

            if self.connection:
                await self.connection.close()
                logger.info("Closed RabbitMQ connection")

            self.is_running = False

        except Exception as e:
            logger.error(f"Error stopping consumer: {e}")

# Global consumer instance
consumer = RabbitMQConsumer()

async def start_rabbitmq_consumer():
    """Start the RabbitMQ consumer"""
    await consumer.start_consuming()

async def stop_rabbitmq_consumer():
    """Stop the RabbitMQ consumer"""
    await consumer.stop_consuming()
