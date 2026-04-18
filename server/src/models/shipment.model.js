const pool = require('../db/connection');

const ShipmentModel = {
  async create(orderId, carrier, service) {
    const { rows } = await pool.query(
      `INSERT INTO shipments (order_id, carrier, service)
       VALUES ($1, $2, $3) RETURNING *`,
      [orderId, carrier, service || '']
    );
    return rows[0];
  },

  async findByOrderId(orderId) {
    const { rows } = await pool.query(
      'SELECT * FROM shipments WHERE order_id = $1',
      [orderId]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM shipments WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async updateAfterGenerate(orderId, data) {
    const { rows } = await pool.query(
      `UPDATE shipments
       SET envia_shipment_id = $1, tracking_number = $2, track_url = $3,
           label_url = $4, status = 'generated', updated_at = NOW()
       WHERE order_id = $5 RETURNING *`,
      [data.enviaShipmentId, data.trackingNumber, data.trackUrl, data.labelUrl, orderId]
    );
    return rows[0] || null;
  },

  async updateStatus(id, status) {
    const { rowCount } = await pool.query(
      'UPDATE shipments SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    return rowCount > 0;
  },

  async setError(orderId, errorMessage) {
    const { rowCount } = await pool.query(
      `UPDATE shipments SET status = 'error', error_message = $1, updated_at = NOW()
       WHERE order_id = $2`,
      [errorMessage, orderId]
    );
    return rowCount > 0;
  },

  async findAll() {
    const { rows } = await pool.query(
      `SELECT s.*, o.user_id, o.total_cents, o.status AS order_status,
              o.shipping_name, o.shipping_city, o.shipping_country, o.created_at AS order_date
       FROM shipments s
       JOIN orders o ON o.id = s.order_id
       ORDER BY s.created_at DESC`
    );
    return rows;
  },
};

module.exports = ShipmentModel;
