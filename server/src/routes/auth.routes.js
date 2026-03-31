const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const { sendVerificationSchema, registerSchema, loginSchema, refreshSchema } = require('../schemas/auth.schema');
const controller = require('../controllers/auth.controller');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
});

router.post('/send-verification', authLimiter, validate(sendVerificationSchema), controller.sendVerification);
router.get('/verify-email', controller.verifyEmail);
router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshSchema), controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getMe);
router.put('/change-password', authenticate, controller.changePassword);
router.put('/change-email', authenticate, controller.changeEmail);

module.exports = router;
