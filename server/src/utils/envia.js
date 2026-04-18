const axios = require('axios');
const config = require('../config/env');

// Envia requires short state codes. Map common full names -> abbreviations.
const STATE_ABBR = {
  // Mexico
  'aguascalientes': 'AG', 'baja california': 'BC', 'baja california sur': 'BS',
  'campeche': 'CM', 'chiapas': 'CS', 'chihuahua': 'CH', 'coahuila': 'CO',
  'colima': 'CL', 'ciudad de mexico': 'DF', 'cdmx': 'DF', 'durango': 'DG',
  'guanajuato': 'GT', 'guerrero': 'GR', 'hidalgo': 'HG', 'jalisco': 'JA',
  'mexico': 'EM', 'estado de mexico': 'EM', 'michoacan': 'MI', 'morelos': 'MO',
  'nayarit': 'NA', 'nuevo leon': 'NL', 'oaxaca': 'OA', 'puebla': 'PU',
  'queretaro': 'QE', 'quintana roo': 'QR', 'san luis potosi': 'SL',
  'sinaloa': 'SI', 'sonora': 'SO', 'tabasco': 'TB', 'tamaulipas': 'TM',
  'tlaxcala': 'TL', 'veracruz': 'VE', 'yucatan': 'YU', 'zacatecas': 'ZA',
  'michoacán': 'MI', 'nuevo león': 'NL', 'querétaro': 'QE',
  'san luis potosí': 'SL', 'yucatán': 'YU',
  'puerto peñasco': 'SO', 'puerto penasco': 'SO',
};

function abbreviateState(state) {
  if (!state) return '';
  // Already a short code (2-3 chars)
  if (state.length <= 3) return state.toUpperCase();
  const key = state.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return STATE_ABBR[key] || STATE_ABBR[state.toLowerCase()] || state;
}

const envia = config.enviaApiKey
  ? axios.create({
      baseURL: config.enviaSandbox
        ? 'https://api-test.envia.com'
        : 'https://api.envia.com',
      headers: {
        Authorization: `Bearer ${config.enviaApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    })
  : null;

function getOrigin() {
  return {
    name: config.enviaOriginName,
    phone: config.enviaOriginPhone,
    street: config.enviaOriginStreet,
    number: config.enviaOriginNumber || 'S/N',
    city: config.enviaOriginCity,
    state: abbreviateState(config.enviaOriginState),
    country: config.enviaOriginCountry,
    postalCode: config.enviaOriginZip,
  };
}

function buildPackages(cartItems) {
  const totalWeight = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.weight_kg) || config.enviaDefaultWeightKg) * item.quantity,
    0
  );

  return [{
    content: cartItems.map(i => i.name).join(', ').slice(0, 100),
    amount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
    type: 'box',
    weight: Math.round(totalWeight * 100) / 100,
    insurance: 0,
    declaredValue: 0,
    weightUnit: 'KG',
    lengthUnit: 'CM',
    dimensions: {
      length: config.enviaDefaultLength,
      width: config.enviaDefaultWidth,
      height: config.enviaDefaultHeight,
    },
  }];
}

module.exports = { envia, getOrigin, buildPackages, abbreviateState };
