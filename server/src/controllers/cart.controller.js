const CartModel = require('../models/cart.model');
const ProductModel = require('../models/product.model');

function getCart(req, res, next) {
  try {
    const items = CartModel.getByUserId(req.userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

function addItem(req, res, next) {
  try {
    const { productId, quantity } = req.body;

    const product = ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    CartModel.addItem(req.userId, productId, quantity);
    const items = CartModel.getByUserId(req.userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

function updateItem(req, res, next) {
  try {
    const { quantity } = req.body;
    const itemId = Number(req.params.itemId);

    const result = CartModel.updateQuantity(itemId, req.userId, quantity);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const items = CartModel.getByUserId(req.userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

function removeItem(req, res, next) {
  try {
    const itemId = Number(req.params.itemId);
    CartModel.removeItem(itemId, req.userId);
    const items = CartModel.getByUserId(req.userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

function clearCart(req, res, next) {
  try {
    CartModel.clearCart(req.userId);
    res.json({ items: [] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
