const pool = require('../db/connection');

const CartModel = {
  async getByUserId(userId) {
    const { rows } = await pool.query(`
      SELECT ci.id, ci.product_id, ci.quantity,
             p.name, p.price_cents, p.image_url, p.stock
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = $1 AND p.active = TRUE
      ORDER BY ci.created_at ASC
    `, [userId]);
    return rows;
  },

  async addItem(userId, productId, quantity) {
    const { rowCount } = await pool.query(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT(user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    `, [userId, productId, quantity]);
    return { changes: rowCount };
  },

  async updateQuantity(itemId, userId, quantity) {
    const { rowCount } = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3',
      [quantity, itemId, userId]
    );
    return { changes: rowCount };
  },

  async removeItem(itemId, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [itemId, userId]
    );
    return { changes: rowCount };
  },

  async clearCart(userId) {
    const { rowCount } = await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    return { changes: rowCount };
  },
};

module.exports = CartModel;
