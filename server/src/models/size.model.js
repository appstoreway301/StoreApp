const pool = require('../db/connection');

const SizeModel = {
  async findAll() {
    const { rows } = await pool.query(
      'SELECT * FROM sizes ORDER BY sort_order ASC, name ASC'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM sizes WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(name, sortOrder = 0) {
    const { rows } = await pool.query(
      'INSERT INTO sizes (name, sort_order) VALUES ($1, $2) RETURNING id',
      [name.trim(), sortOrder]
    );
    return rows[0].id;
  },

  async update(id, { name, sortOrder }) {
    const { rowCount } = await pool.query(
      'UPDATE sizes SET name = $1, sort_order = $2 WHERE id = $3',
      [name.trim(), sortOrder, id]
    );
    return rowCount > 0;
  },

  async delete(id) {
    await pool.query('DELETE FROM product_sizes WHERE size_id = $1', [id]);
    const { rowCount } = await pool.query('DELETE FROM sizes WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async findByProductId(productId) {
    const { rows } = await pool.query(
      `SELECT s.* FROM sizes s
       JOIN product_sizes ps ON ps.size_id = s.id
       WHERE ps.product_id = $1
       ORDER BY s.sort_order ASC, s.name ASC`,
      [productId]
    );
    return rows;
  },

  async findByProductIds(productIds) {
    if (productIds.length === 0) return {};
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await pool.query(
      `SELECT ps.product_id, s.id, s.name FROM sizes s
       JOIN product_sizes ps ON ps.size_id = s.id
       WHERE ps.product_id IN (${placeholders})
       ORDER BY s.sort_order ASC, s.name ASC`,
      productIds
    );
    const map = {};
    for (const row of rows) {
      if (!map[row.product_id]) map[row.product_id] = [];
      map[row.product_id].push({ id: row.id, name: row.name });
    }
    return map;
  },

  async setProductSizes(productId, sizeIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM product_sizes WHERE product_id = $1', [productId]);
      for (const sizeId of sizeIds) {
        await client.query(
          'INSERT INTO product_sizes (product_id, size_id) VALUES ($1, $2)',
          [productId, sizeId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = SizeModel;