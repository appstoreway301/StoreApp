const { z } = require('zod');

const addToCartSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99).default(1),
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

module.exports = { addToCartSchema, updateCartSchema };
