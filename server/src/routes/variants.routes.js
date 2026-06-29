const { Router } = require('express');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const controller = require('../controllers/variants.controller');

const router = Router();

// ============================================================
// RUTA PÚBLICA - Sin autenticación (para clientes)
// ============================================================
router.get('/product/:productId', controller.getByProduct);

// ============================================================
// RUTAS PROTEGIDAS - Solo admin
// ============================================================
router.use(authenticate, requireAdmin);

router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/stock', controller.updateStock);
router.delete('/:id', controller.delete);
router.delete('/product/:productId', controller.deleteByProduct);

module.exports = router;