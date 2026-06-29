const pool = require('../db/connection');

const CartModel = {
  async getByUserId(userId) {
    const { rows } = await pool.query(`
      SELECT 
        ci.id, 
        ci.product_id, 
        ci.quantity,
        ci.variant_id,
        p.name, 
        p.price_cents, 
        p.image_url as product_image_url,
        pv.image_url as variant_image_url,  -- 👈 AGREGAR ESTO
        pv.size,
        pv.color,
        pv.stock as variant_stock
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      LEFT JOIN product_variants pv ON pv.id = ci.variant_id
      WHERE ci.user_id = $1 AND p.active = TRUE
      ORDER BY ci.created_at ASC
    `, [userId]);
    console.log('📦 [MODEL] getByUserId rows:', rows);
    return rows;
  },

  // ✅ AGREGAR variantId
  async addItem(userId, productId, quantity, variantId = null) {
    console.log('📦 [MODEL] addItem:', { userId, productId, quantity, variantId });
    
    const { rowCount } = await pool.query(`
      INSERT INTO cart_items (user_id, product_id, quantity, variant_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(user_id, product_id, variant_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    `, [userId, productId, quantity, variantId]);
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
    const { rowCount } = await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [userId]
    );
    return { changes: rowCount };
  },
};

module.exports = CartModel;