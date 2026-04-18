const { Router } = require('express');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const validate = require('../middleware/validate');
const { quoteShippingSchema } = require('../schemas/shipping.schema');
const controller = require('../controllers/shipping.controller');

const router = Router();

// User endpoints
router.post('/quote', authenticate, validate(quoteShippingSchema), controller.getQuotes);
router.get('/track/:orderId', authenticate, controller.trackShipment);

// Admin endpoints
router.get('/admin/shipments', authenticate, requireAdmin, controller.getShipments);
router.post('/admin/shipments/:id/retry', authenticate, requireAdmin, controller.retryLabel);
router.post('/admin/shipments/:id/cancel', authenticate, requireAdmin, controller.cancelShipment);

module.exports = router;
