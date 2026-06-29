const pool = require('../db/connection');

const ColorModel = {
  async findAll() {
    const { rows } = await pool.query(
      'SELECT * FROM colors ORDER BY sort_order ASC, name ASC'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM colors WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(name, hexCode = null, sortOrder = 0) {
    const { rows } = await pool.query(
      'INSERT INTO colors (name, hex_code, sort_order) VALUES ($1, $2, $3) RETURNING id',
      [name.trim(), hexCode, sortOrder]
    );
    return rows[0].id;
  },

  async update(id, { name, hexCode, sortOrder }) {
    const { rowCount } = await pool.query(
      'UPDATE colors SET name = $1, hex_code = $2, sort_order = $3 WHERE id = $4',
      [name.trim(), hexCode, sortOrder, id]
    );
    return rowCount > 0;
  },

  async delete(id) {
    await pool.query('DELETE FROM product_colors WHERE color_id = $1', [id]);
    const { rowCount } = await pool.query('DELETE FROM colors WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async findByProductId(productId) {
    const { rows } = await pool.query(
      `SELECT c.* FROM colors c
       JOIN product_colors pc ON pc.color_id = c.id
       WHERE pc.product_id = $1
       ORDER BY c.sort_order ASC, c.name ASC`,
      [productId]
    );
    return rows;
  },

  async findByProductIds(productIds) {
    if (productIds.length === 0) return {};
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await pool.query(
      `SELECT pc.product_id, c.id, c.name FROM colors c
       JOIN product_colors pc ON pc.color_id = c.id
       WHERE pc.product_id IN (${placeholders})
       ORDER BY c.sort_order ASC, c.name ASC`,
      productIds
    );
    const map = {};
    for (const row of rows) {
      if (!map[row.product_id]) map[row.product_id] = [];
      map[row.product_id].push({ id: row.id, name: row.name });
    }
    return map;
  },

  async setProductColors(productId, colorIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM product_colors WHERE product_id = $1', [productId]);
      for (const colorId of colorIds) {
        await client.query(
          'INSERT INTO product_colors (product_id, color_id) VALUES ($1, $2)',
          [productId, colorId]
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

module.exports = ColorModel;