const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Directories for storing videos and HLS output
const VIDEO_DIR = path.join(__dirname, 'videos');
const HLS_DIR = path.join(__dirname, 'hls');

// Ensure directories exist or storing videos and HLS output
[VIDEO_DIR, HLS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
    const outputPath = path.join(outputDir, videoId, 'index.m3u8');
    const segmentPath = path.join(outputDir, videoId, 'segment_%03d.ts');

    // Create video-specific directory if it exist
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

// Upload and convert video to HLS using POST /api/upload
app.post('/api/upload', express.json(), async (req, res) => {
  try {
    const { videoPath, videoId } = req.body;
    
    if (!videoPath || !videoId) {
      return res.status(400).json({ error: 'Missing videoPath or videoId' });
    }

    // Convert to HLS
    await convertToHLS(videoPath, HLS_DIR, videoId);
    
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
app.get('/hls/:videoId/index.m3u8', (req, res) => {
  const { videoId } = req.params;
  const manifestPath = path.join(HLS_DIR, videoId, 'index.m3u8');

  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.sendFile(manifestPath);
});

// Serve HLS segments using GET /hls/:videoId/:segment
app.get('/hls/:videoId/:segment', (req, res) => {
  const { videoId, segment } = req.params;
  const segmentPath = path.join(HLS_DIR, videoId, segment);

  if (!fs.existsSync(segmentPath)) {
    return res.status(404).json({ error: 'Segment not found' });
  }

  res.setHeader('Content-Type', 'video/MP2T');
  res.sendFile(segmentPath);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hls-backend' });
});

// Start server and listen on specified port
app.listen(PORT, () => {
  console.log(`HLS Backend running on port ${PORT}`);
  console.log(`Video directory: ${VIDEO_DIR}`);
  console.log(`HLS output directory: ${HLS_DIR}`);
});
