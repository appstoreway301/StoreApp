const path = require('path');
const { Router } = require('express');
const multer = require('multer');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const controller = require('../controllers/admin.controller');

const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename(req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.use(authenticate, requireAdmin);

router.get('/products', controller.getProducts);
router.post('/products', controller.createProduct);
router.put('/products/:id', controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);

router.post('/products/:id/images', controller.addProductImage);
router.delete('/images/:imageId', controller.removeProductImage);

router.get('/categories', controller.getCategories);
router.post('/categories', controller.createCategory);
router.put('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

router.get('/stock', controller.getStockDashboard);

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ image_url: imageUrl });
});

module.exports = router;
