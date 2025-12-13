const amqp = require('amqplib');

// Get connection URL from environment variable
const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';

const vidoeupdateChannelQueue = process.env.VIDEO_UPDATE_CHANNEL || 'hls_updates';
const filepathChannelQueue = process.env.FILEPATH_CHANNEL || 'filepath_channel';

let connection = null;
let channel = null;

async function connectToRabbitMQ() {
    try {
        connection = await amqp.connect(rabbitmqUrl);
        channel = await connection.createChannel(function(error1, channel) {
            if (error1) {
            throw error1;
            }

            // create a queue for video updates
            channel.assertQueue(vidoeupdateChannelQueue, { 
            durable: false
            });

            // create a queue for filepath messages
            channel.assertQueue(filepathChannelQueue, { 
            durable: false
            });
        });
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
}

function sendUpdate(message) {
    channel.sendToQueue(vidoeupdateChannelQueue, Buffer.from(message));
    console.log(" [x] Sent %s to buffer %a", message, vidoeupdateChannelQueue);
}

function sendFilepath(message) {
    channel.sendToQueue(filepathChannelQueue, Buffer.from(message));
    console.log(" [x] Sent %s to buffer %a", message, filepathChannelQueue);
}

async function disconnectFromRabbitMQ() {
    try {
        await connection.close();
        console.log('Disconnected from RabbitMQ successfully');
        return true;
    } catch (error) {
        console.error('Failed to disconnect from RabbitMQ:', error);
        throw error;
    } 
}

module.exports = { connectToRabbitMQ, disconnectFromRabbitMQ, sendUpdate, sendFilepath };