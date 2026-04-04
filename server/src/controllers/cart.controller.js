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
    const { productId, quantity } = req.body;

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verificar stock disponible considerando lo que ya hay en el carrito
    const currentCart = await CartModel.getByUserId(req.userId);
    const existingItem = currentCart.find(item => item.product_id === productId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    if (currentQty + quantity > product.stock) {
      return res.status(400).json({
        error: `Insufficient stock. Available: ${product.stock}, in cart: ${currentQty}`,
      });
    }

    await CartModel.addItem(req.userId, productId, quantity);
    const items = await CartModel.getByUserId(req.userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { quantity } = req.body;
    const itemId = Number(req.params.itemId);

    // Verificar stock antes de actualizar
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
