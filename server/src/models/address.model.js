const pool = require('../db/connection');

const MAX_ADDRESSES = 3;

const AddressModel = {
  async findByUserId(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  },

  async countByUserId(userId) {
    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM user_addresses WHERE user_id = $1',
      [userId]
    );
    return rows[0].count;
  },

  async create(userId, { label, name, address, city, state, zip, country, phone, is_default }) {
    if (is_default) {
      await pool.query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [userId]
      );
    }
    const { rows } = await pool.query(
      `INSERT INTO user_addresses (user_id, label, name, address, city, state, zip, country, phone, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, label || 'Home', name, address, city, state, zip, country, phone || '', is_default || false]
    );
    return rows[0];
  },

  async update(id, userId, { label, name, address, city, state, zip, country, phone, is_default }) {
    if (is_default) {
      await pool.query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [userId]
      );
    }
    const { rows } = await pool.query(
      `UPDATE user_addresses SET label = $1, name = $2, address = $3, city = $4, state = $5,
       zip = $6, country = $7, phone = $8, is_default = $9
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [label || 'Home', name, address, city, state, zip, country, phone || '', is_default || false, id, userId]
    );
    return rows[0] || null;
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },

  MAX_ADDRESSES,
};

module.exports = AddressModel;
