const { Router } = require('express');
const authenticate = require('../middleware/auth');
const controller = require('../controllers/orders.controller');

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);

module.exports = router;
