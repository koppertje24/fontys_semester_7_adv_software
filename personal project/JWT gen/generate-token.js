// If jsonwebtoken is not installed, run: npm install jsonwebtoken
const jwt = require('jsonwebtoken');

// CONFIGURATION - Update these values
const CONFIG = {
    iss: 'bSOBEpPX4RLjSDkXij3X7QqmjpNJ6Jem', // Must match Kong consumer's JWT key
    secret: 'GPce1zSX20RBZLXi44MCmZaztYIxsTcF',         // Must match Kong consumer's JWT secret
    expiryHours: 1                     // Token valid for 1 hour
};

// Generate JWT token for testing Kong gateway
function generateToken() {
    const payload = {
        iss: CONFIG.iss,
        sub: 'hls-service',
        aud: 'hls-backend',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * CONFIG.expiryHours),
        iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, CONFIG.secret, { algorithm: 'HS256' });

    console.log('Generated JWT Token:');
    console.log(token);
    console.log('\nUse in Authorization header:');
    console.log(`Authorization: Bearer ${token}`);
    console.log('\nTest with cURL:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:8000/hls/video1/index.m3u8`);

    return token;
}

// Generate token
try {
    generateToken();
} catch (error) {
    console.error('Error generating token:', error.message);
    console.log('\nMake sure to run: npm install jsonwebtoken');
}

// Export for use in other scripts
module.exports = { generateToken };
