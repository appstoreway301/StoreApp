const { Router } = require('express');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { addToCartSchema, updateCartSchema } = require('../schemas/cart.schema');
const controller = require('../controllers/cart.controller');

const router = Router();

router.use(authenticate);

router.get('/', controller.getCart);
router.post('/', validate(addToCartSchema), controller.addItem);
router.put('/:itemId', validate(updateCartSchema), controller.updateItem);
router.delete('/:itemId', controller.removeItem);
router.delete('/', controller.clearCart);

module.exports = router;
