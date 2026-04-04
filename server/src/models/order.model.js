const pool = require('../db/connection');

const OrderModel = {
  async create(userId, totalCents, items, stripeSessionId, shipping = {}) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO orders (user_id, total_cents, stripe_session_id, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          userId, totalCents, stripeSessionId,
          shipping.name || '', shipping.address || '', shipping.city || '',
          shipping.state || '', shipping.zip || '', shipping.country || '',
          shipping.phone || ''
        ]
      );
      const orderId = rows[0].id;

      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, product_name, price_cents, quantity) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.product_id, item.name, item.price_cents, item.quantity]
        );
      }

      await client.query('COMMIT');
      return orderId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findByUserId(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async findByIdAndUserId(orderId, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    return rows[0] || null;
  },

  async findItemsByOrderId(orderId) {
    const { rows } = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    return rows;
  },

  async updateStatus(stripeSessionId, status, paymentIntent) {
    const { rowCount } = await pool.query(
      'UPDATE orders SET status = $1, stripe_payment_intent = $2 WHERE stripe_session_id = $3',
      [status, paymentIntent, stripeSessionId]
    );
    return { changes: rowCount };
  },

  async findByStripeSessionId(sessionId) {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE stripe_session_id = $1',
      [sessionId]
    );
    return rows[0] || null;
  },

  async markProcessed(orderId) {
    const { rowCount } = await pool.query(
      'UPDATE orders SET processed = TRUE WHERE id = $1 AND processed = FALSE',
      [orderId]
    );
    return rowCount > 0;
  },
};

module.exports = OrderModel;
