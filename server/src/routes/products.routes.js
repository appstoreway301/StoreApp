const { Router } = require('express');
const controller = require('../controllers/products.controller');

const router = Router();

router.get('/', controller.list);
router.get('/featured', controller.getFeatured); // 👈 NUEVA RUTA
router.get('/categories', controller.listCategories);
router.get('/:id', controller.getById);

module.exports = router;