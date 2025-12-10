const amqp = require('amqplib');

// Get connection URL from environment variable
const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';

async function connectToRabbitMQ() {
    try {
        const connection = await amqp.connect(rabbitmqUrl);
        const channel = await connection.createChannel();
        return { connection, channel };
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
}

async function disconnectFromRabbitMQ(connection) {
    try {
        await connection.close();
        console.log('Disconnected from RabbitMQ successfully');
        return true;
    } catch (error) {
        console.error('Failed to disconnect from RabbitMQ:', error);
        throw error;
    } 
}

module.exports = { connectToRabbitMQ, disconnectFromRabbitMQ };