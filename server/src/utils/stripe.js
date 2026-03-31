const Stripe = require('stripe');
const config = require('../config/env');

const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey)
  : null;

module.exports = stripe;
