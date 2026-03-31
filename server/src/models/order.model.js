const db = require('../db/connection');

const OrderModel = {
  create(userId, totalCents, items, stripeSessionId) {
    const insertOrder = db.prepare(
      'INSERT INTO orders (user_id, total_cents, stripe_session_id) VALUES (?, ?, ?)'
    );
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, price_cents, quantity) VALUES (?, ?, ?, ?, ?)'
    );

    const createOrder = db.transaction(() => {
      const { lastInsertRowid } = insertOrder.run(userId, totalCents, stripeSessionId);
      for (const item of items) {
        insertItem.run(lastInsertRowid, item.product_id, item.name, item.price_cents, item.quantity);
      }
      return lastInsertRowid;
    });

    return createOrder();
  },

  findByUserId(userId) {
    return db.prepare(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
  },

  findByIdAndUserId(orderId, userId) {
    return db.prepare(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?'
    ).get(orderId, userId);
  },

  findItemsByOrderId(orderId) {
    return db.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).all(orderId);
  },

  updateStatus(stripeSessionId, status, paymentIntent) {
    return db.prepare(
      'UPDATE orders SET status = ?, stripe_payment_intent = ? WHERE stripe_session_id = ?'
    ).run(status, paymentIntent, stripeSessionId);
  },

  findByStripeSessionId(sessionId) {
    return db.prepare(
      'SELECT * FROM orders WHERE stripe_session_id = ?'
    ).get(sessionId);
  },
};

module.exports = OrderModel;
