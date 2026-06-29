const CartModel = require('../models/cart.model');
const ProductModel = require('../models/product.model');

async function getCart(req, res, next) {
  try {
    const items = await CartModel.getByUserId(req.userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { productId, quantity, variantId } = req.body;

    console.log('📦 [BACKEND] addItem recibido:', { productId, quantity, variantId });

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verificar stock
    const currentCart = await CartModel.getByUserId(req.userId);
    const existingItem = currentCart.find(item => 
      item.product_id === productId && 
      (item.variant_id === variantId || (item.variant_id === null && variantId === null))
    );
    const currentQty = existingItem ? existingItem.quantity : 0;
    if (currentQty + quantity > product.stock) {
      return res.status(400).json({
        error: `Insufficient stock. Available: ${product.stock}, in cart: ${currentQty}`,
      });
    }

    // ✅ PASAR variantId al modelo
    await CartModel.addItem(req.userId, productId, quantity, variantId || null);
    const items = await CartModel.getByUserId(req.userId);
    console.log('📦 [BACKEND] Carrito actualizado:', items);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { quantity } = req.body;
    const itemId = Number(req.params.itemId);

    const currentCart = await CartModel.getByUserId(req.userId);
    const cartItem = currentCart.find(item => item.id === itemId);
    if (cartItem && quantity > cartItem.stock) {
      return res.status(400).json({
        error: `Insufficient stock. Available: ${cartItem.stock}`,
      });
    }

    const result = await CartModel.updateQuantity(itemId, req.userId, quantity);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const items = await CartModel.getByUserId(req.userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const itemId = Number(req.params.itemId);
    await CartModel.removeItem(itemId, req.userId);
    const items = await CartModel.getByUserId(req.userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function clearCart(req, res, next) {
  try {
    await CartModel.clearCart(req.userId);
    res.json({ items: [] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };