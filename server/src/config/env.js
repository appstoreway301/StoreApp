const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

if (!config.jwtSecret || !config.jwtRefreshSecret) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in .env');
  process.exit(1);
}

module.exports = config;
