const { Router } = require('express');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const controller = require('../controllers/sizes.controller');

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;