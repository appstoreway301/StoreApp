const { z } = require('zod');

const addToCartSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99).default(1),
  variantId: z.number().int().nullable().optional(), // 👈 ESTO ES LO QUE FALTA
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

module.exports = { addToCartSchema, updateCartSchema };