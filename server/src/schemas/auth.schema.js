const { z } = require('zod');

const sendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const registerSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

module.exports = { sendVerificationSchema, registerSchema, loginSchema, refreshSchema };
