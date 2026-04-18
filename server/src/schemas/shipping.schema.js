const { z } = require('zod');

const quoteShippingSchema = z.object({
  destination: z.object({
    name: z.string().min(1, 'Name is required'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(2).max(3, 'Country code is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    phone: z.string().optional().default(''),
  }),
});

module.exports = { quoteShippingSchema };
