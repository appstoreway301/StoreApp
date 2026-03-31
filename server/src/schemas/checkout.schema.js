const { z } = require('zod');

const verifySessionSchema = z.object({
  sessionId: z.string().min(1),
});

module.exports = { verifySessionSchema };
