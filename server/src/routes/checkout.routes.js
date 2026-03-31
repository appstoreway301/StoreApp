const { Router } = require('express');
const authenticate = require('../middleware/auth');
const controller = require('../controllers/checkout.controller');

const router = Router();

router.post('/create-session', authenticate, controller.createSession);
router.post('/webhook', controller.handleWebhook);
router.get('/verify', authenticate, controller.verifySession);

module.exports = router;
