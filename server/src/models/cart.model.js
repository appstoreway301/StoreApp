const db = require('../db/connection');

const CartModel = {
  getByUserId(userId) {
    return db.prepare(`
      SELECT ci.id, ci.product_id, ci.quantity,
             p.name, p.price_cents, p.image_url, p.stock
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = ? AND p.active = 1
      ORDER BY ci.created_at ASC
    `).all(userId);
  },

  addItem(userId, productId, quantity) {
    return db.prepare(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, product_id)
      DO UPDATE SET quantity = quantity + excluded.quantity
    `).run(userId, productId, quantity);
  },

  updateQuantity(itemId, userId, quantity) {
    return db.prepare(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?'
    ).run(quantity, itemId, userId);
  },

  removeItem(itemId, userId) {
    return db.prepare(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?'
    ).run(itemId, userId);
  },

  clearCart(userId) {
    return db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
  },
};

module.exports = CartModel;
