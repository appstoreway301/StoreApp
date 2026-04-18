const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/storeapp',
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Envia.com shipping
  enviaApiKey: process.env.ENVIA_API_KEY,
  enviaSandbox: process.env.ENVIA_SANDBOX === 'true',
  enviaOriginName: process.env.ENVIA_ORIGIN_NAME || '',
  enviaOriginPhone: process.env.ENVIA_ORIGIN_PHONE || '',
  enviaOriginStreet: process.env.ENVIA_ORIGIN_STREET || '',
  enviaOriginCity: process.env.ENVIA_ORIGIN_CITY || '',
  enviaOriginState: process.env.ENVIA_ORIGIN_STATE || '',
  enviaOriginCountry: process.env.ENVIA_ORIGIN_COUNTRY || 'MX',
  enviaOriginNumber: process.env.ENVIA_ORIGIN_NUMBER || 'S/N',
  enviaOriginZip: process.env.ENVIA_ORIGIN_ZIP || '',
  enviaDefaultWeightKg: parseFloat(process.env.ENVIA_DEFAULT_WEIGHT_KG) || 1.0,
  enviaDefaultLength: parseInt(process.env.ENVIA_DEFAULT_LENGTH_CM, 10) || 30,
  enviaDefaultWidth: parseInt(process.env.ENVIA_DEFAULT_WIDTH_CM, 10) || 20,
  enviaDefaultHeight: parseInt(process.env.ENVIA_DEFAULT_HEIGHT_CM, 10) || 15,
  enviaCarriers: process.env.ENVIA_CARRIERS || '',
};

if (!config.jwtSecret || !config.jwtRefreshSecret) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in .env');
  process.exit(1);
}

module.exports = config;
