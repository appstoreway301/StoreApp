const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const { sendVerificationSchema, registerSchema, loginSchema, refreshSchema } = require('../schemas/auth.schema');
const controller = require('../controllers/auth.controller');

const router = Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename(req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

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
router.put('/avatar', authenticate, controller.updateAvatar);
router.post('/avatar/upload', authenticate, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    res.json({ image_url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
