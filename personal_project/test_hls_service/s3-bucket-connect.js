const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, ListBucketsCommand } = require("@aws-sdk/client-s3");

const s3Config = {
  region: "us-east-1",
  endpoint: process.env.S3_DATABASE_ENDPOINT || "IP_ADDRESS:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "ACCESSKEY",
    secretAccessKey: process.env.S3_SECRET_KEY || "SECRETACCESSKEY",
  },
};

const s3Bucket = process.env.S3_BUCKET || "mybucket";

let s3Client = null;

// Function to connect to S3 service
async function connectToS3(testConnection = true) {
    if (!s3Config.endpoint || !s3Config.credentials.accessKeyId || !s3Config.credentials.secretAccessKey || !s3Bucket) {
        throw new Error("Missing required S3 environment variables: S3_DATABASE_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET");
    }

    // Singleton: Return existing client if already initialized
    if (s3Client) {
        console.log("S3 client already initialized");
        return s3Client;
    }

    try {
        console.log("Initializing S3 client...");
        s3Client = new S3Client(s3Config);
        console.log("S3 client initialized successfully");

        if (testConnection) {
        console.log("Testing S3 connection...");
        await s3Client.send(new ListBucketsCommand({}));
        console.log("S3 connection test passed");
        }

        return s3Client;
    } catch (error) {
        console.error("Failed to connect to S3:", error.message);
        s3Client = null; // Reset on failure
        throw error;
    }
}

// Function to upload a folder to S3
async function uploadFolder (folderPath, prefix) {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const fileContent = fs.readFileSync(fullPath);

        await s3Client.send(new PutObjectCommand({
        Bucket: s3Bucket,
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

// Function to retrieve object from S3
async function retrievingFromS3(key){
    const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key,
    });

    const response = await s3Client.send(command);
    return response.Body;
}

module.exports = { connectToS3, uploadFolder, retrievingFromS3 };