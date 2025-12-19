const amqp = require('amqplib');
const mm = require("music-metadata");

// Get connection URL from environment variable
const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';

const vidoecreateChannelQueue = process.env.VIDEO_CREATE_CHANNEL || 'video_create';
const vidoeupdateChannelQueue = process.env.VIDEO_UPDATE_CHANNEL || 'video_updates';

let connection = null;
let channel = null;

async function connectToRabbitMQ() {
    try {
        connection = await amqp.connect(rabbitmqUrl);
        channel = await connection.createChannel(function(error1, channel) {
            if (error1) {
            throw error1;
            }

            // create a queue for video creates
            channel.assertQueue(vidoecreateChannelQueue, { 
            durable: false
            });

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

async function getAudioInfoCreate(videoId, file, status="") {
  const metadata = await mm.parseFile(file.path);

  return JSON.stringify({
    id: videoId,
    status: status,
    name: metadata.common.title || file.originalname,
    artist: metadata.common.artist || "Unknown Artist",
    album: metadata.common.album || "Unknown Album",
    genre: metadata.common.genre?.[0] || "Unknown Genre",
    duration: Math.round(metadata.format.duration || 0),
    year: metadata.common.year || "Unknown Year"
  });
}

async function getAudioInfoUpdate(videoId, status="") {
  return JSON.stringify({
    id: videoId,
    status: status,
  });
}

async function sendCreate(videoId, file) {
    let message = await getAudioInfoCreate(videoId, file, "processing");
    channel.sendToQueue(vidoecreateChannelQueue, Buffer.from(message));
    console.log(" [x] Sent %s to buffer %a", message, vidoecreateChannelQueue);
}

async function sendUpdate(videoId, status="processed") {
    let message = await getAudioInfoUpdate(videoId, status);
    channel.sendToQueue(vidoeupdateChannelQueue, Buffer.from(message));
    console.log(" [x] Sent %s to buffer %a", message, vidoeupdateChannelQueue);
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

module.exports = { connectToRabbitMQ, disconnectFromRabbitMQ, sendCreate, sendUpdate };