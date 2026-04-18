const { Router } = require('express');
const authenticate = require('../middleware/auth');
const controller = require('../controllers/address.controller');

const router = Router();

router.get('/', authenticate, controller.list);
router.post('/', authenticate, controller.create);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.remove);
router.put('/:id/default', authenticate, controller.setDefault);

module.exports = router;
