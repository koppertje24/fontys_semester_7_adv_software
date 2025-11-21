const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Directories
const VIDEO_DIR = path.join(__dirname, 'videos');
const HLS_DIR = path.join(__dirname, 'hls');

// Ensure directories exist
[VIDEO_DIR, HLS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware: Verify JWT token from gateway
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify token (replace with your actual secret/public key)
    const decoded = jwt.verify(token, "see_env_file"); // TODO: make it use the env file
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token', error_context: err});
  }
};

// CORS headers (adjust for your gateway)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
});

// Convert video to HLS format
const convertToHLS = (inputPath, outputDir, videoId) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, videoId, 'index.m3u8');
    const segmentPath = path.join(outputDir, videoId, 'segment_%03d.ts');

    // Create video-specific directory
    const videoDir = path.join(outputDir, videoId);
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    ffmpeg(inputPath)
      .outputOptions([
        '-codec: copy',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls'
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

// API: Upload and convert video to HLS
app.post('/api/upload', verifyToken, express.json(), async (req, res) => {
  try {
    const { videoPath, videoId } = req.body;
    
    if (!videoPath || !videoId) {
      return res.status(400).json({ error: 'Missing videoPath or videoId' });
    }

    // Convert to HLS
    await convertToHLS(videoPath, HLS_DIR, videoId);
    
    res.json({ 
      success: true, 
      manifestUrl: `/hls/${videoId}/index.m3u8` 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process video' });
  }
});

// API: Serve HLS manifest (protected)
app.get('/hls/:videoId/index.m3u8', verifyToken, (req, res) => {
  const { videoId } = req.params;
  const manifestPath = path.join(HLS_DIR, videoId, 'index.m3u8');

  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.sendFile(manifestPath);
});

// API: Serve HLS segments (protected)
app.get('/hls/:videoId/:segment', verifyToken, (req, res) => {
  const { videoId, segment } = req.params;
  const segmentPath = path.join(HLS_DIR, videoId, segment);

  if (!fs.existsSync(segmentPath)) {
    return res.status(404).json({ error: 'Segment not found' });
  }

  res.setHeader('Content-Type', 'video/MP2T');
  res.sendFile(segmentPath);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hls-backend' });
});

// Start server
app.listen(PORT, () => {
  console.log(`HLS Backend running on port ${PORT}`);
  console.log(`Video directory: ${VIDEO_DIR}`);
  console.log(`HLS output directory: ${HLS_DIR}`);
});
