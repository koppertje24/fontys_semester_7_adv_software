
const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const rabbitmq = require('./rabbitmq-connect');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: "IP_ADDRESS:9000", // MinIO server address
  forcePathStyle: true,  // REQUIRED for MinIO
  credentials: {
    accessKeyId: "ACCESSKEY",
    secretAccessKey: "SECRETACCESSKEY",
  },
});

const s3Bucket = "mybucket";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "video/mp4",
      "video/mpeg",
      "audio/flac",
      "audio/x-flac",
      "application/octet-stream",
      "audio/mpeg",
      "audio/wav"
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  }
});

const TEMP_DIR = path.join(os.tmpdir(), 'hls-processing');

let rabbitmqconnection = null

// // test database connection
// async function upload() {
//   const data = Buffer.from("Hello from Node.js + MinIO!");

//   const command = new PutObjectCommand({
//     Bucket: "mybucket",
//     Key: "hello.txt",
//     Body: data,
//   });

//   await s3.send(command);
//   console.log("Uploaded to MinIO!");
// }
// // ending test database connection

// Ensure directories exist or storing videos and HLS output
// [VIDEO_DIR, HLS_DIR].forEach(dir => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// });

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
});

// Convert video to HLS format using ffmpeg
const convertToHLS = (inputPath, outputDir, videoId) => {
  return new Promise((resolve, reject) => {
    const videoDir = path.join(outputDir, videoId);

    const outputPath = path.join(videoDir, 'index.m3u8');
    const segmentPath = path.join(videoDir, 'segment_%03d.ts');

    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    console.log(`Converting ${inputPath} to HLS at ${videoDir}`);

    ffmpeg(inputPath, { timeout: 432000 })
      .audioCodec("aac")             // HLS compatible audio codec
      .audioChannels(2)
      .audioBitrate("128k")
      .audioFrequency(48000)         // Match input sample rate
      .audioFilter("aformat=sample_rates=48000")
      .format("hls")               
      .outputOptions([
        "-vn",                       // no video stream (audio only)
        "-hls_time 10",
        "-hls_list_size 0",
        "-hls_segment_type mpegts",
        `-hls_segment_filename ${segmentPath}`,
        "-hls_flags independent_segments"
      ])
      .output(outputPath)
      .on("start", (cmdline) => {
        console.log("FFmpeg command:", cmdline);
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on("end", () => {
        console.log("Conversion finished");
        resolve(videoDir);
      })
      .on("error", (err, stdout, stderr) => {
        console.error("FFmpeg error:", err);
        console.error("FFmpeg stderr:", stderr);
        console.error("FFmpeg stdout:", stdout);
        reject(err);
      })
      .run();
  });
};


const uploadFolderToMinIO = async (folderPath, bucket, prefix) => {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    const fileContent = fs.readFileSync(fullPath);

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `${prefix}/${file}`,
      Body: fileContent,
      ContentType: file.endsWith('.ts') 
        ? 'video/mp2t' 
        : file.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : undefined
    }));
  }
};

// Upload and convert video to HLS using POST /api/upload
app.post('/api/upload', upload.single("video"), async (req, res) => {
  try {
    const file = req.file;
    const videoId = req.body.videoId;

    if (!file) {
      return res.status(400).json({ error: "Missing video file" });
    }
    
    if (!videoId) {
      return res.status(400).json({ error: "Missing videoId" });
    }

    // Local temp path where multer saved the file
    const videoPath = file.path;

    // Convert to HLS
    const hlsOutputFolder = await convertToHLS(videoPath, TEMP_DIR, videoId);

    // Upload to MinIO
    await uploadFolderToMinIO(hlsOutputFolder, s3Bucket, `hls/${videoId}`);
    
    // Respond with manifest URL
    res.json({ 
      success: true, 
      manifestUrl: `/hls/${videoId}/index.m3u8` 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process video' });
  }
});

// Function to retrieve object from S3
const retrievingFromS3 = async (bucket, key) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3.send(command);
  return response.Body;
}

// serve original video
app.get('/vid/:videoId', (req, res) => {
  const { videoId } = req.params;
  const manifestPath = path.join(VIDEO_DIR, videoId);

  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.sendFile(manifestPath);
});

// Serve HLS manifest using GET /hls/:videoId/index.m3u8
app.get('/hls/:videoId/index.m3u8', async (req, res) => {
  const { videoId } = req.params;
  const s3Key = `hls/${videoId}/index.m3u8`;

  try {
    const response = await retrievingFromS3(s3Bucket, s3Key);
    
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    response.pipe(res);

  } catch (error) {
    console.error('Error retrieving from S3:', error);
    res.status(404).json({ error: 'Video not found' });
  }
});

// Serve HLS segments using GET /hls/:videoId/:segment
app.get('/hls/:videoId/:segment', async (req, res) => {
  const { videoId, segment } = req.params;
  const s3Key = `hls/${videoId}/${segment}`;

  try {
    const response = await retrievingFromS3(s3Bucket, s3Key);
    
    res.setHeader('Content-Type', 'video/MP2T');
    response.pipe(res);

  } catch (error) {
    console.error('Error retrieving from S3:', error);
    res.status(404).json({ error: 'Video not found' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hls-backend' });
});

// Readiness check endpoint
let isReady = false;
app.get('/ready', (req, res) => {
  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

async function initializeServices() {
  try {
    console.log('Connecting to RabbitMQ...');
    rabbitmqconnection = await rabbitmq.connectToRabbitMQ();
    isReady = true;
    console.log('Connected to RabbitMQ');
    console.log('Service initialized successfully');
    
    // // first consume messages as an example of functionality
    // await rabbitmq.consumeMessages('my-queue', async (message) => {
    //   console.log('Received message:', message);
    //   // Process your message here, for later, this is just a placeholder
    // });

  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await rabbitmq.disconnectFromRabbitMQ(rabbitmqconnection.connection);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing connections...');
  await rabbitmq.disconnectFromRabbitMQ(rabbitmqconnection.connection);
  process.exit(0);
});

// Start server and listen on specified port
app.listen(PORT, () => {
  console.log(`HLS Backend running on port ${PORT}`);
  console.log(`connected to rabbitmq`);
  initializeServices();
});


