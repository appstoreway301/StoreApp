const pool = require('../db/connection');

const CategoryModel = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(name) {
    const { rows } = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [name]);
    return rows[0].id;
  },

  async update(id, name) {
    const { rowCount } = await pool.query('UPDATE categories SET name = $1 WHERE id = $2', [name, id]);
    return rowCount > 0;
  },

  async delete(id) {
    await pool.query('DELETE FROM product_categories WHERE category_id = $1', [id]);
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async findByProductId(productId) {
    const { rows } = await pool.query(
      `SELECT c.* FROM categories c
       JOIN product_categories pc ON pc.category_id = c.id
       WHERE pc.product_id = $1
       ORDER BY c.name ASC`,
      [productId]
    );
    return rows;
  },

  async findByProductIds(productIds) {
    if (productIds.length === 0) return {};
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await pool.query(
      `SELECT pc.product_id, c.id, c.name FROM categories c
       JOIN product_categories pc ON pc.category_id = c.id
       WHERE pc.product_id IN (${placeholders})
       ORDER BY c.name ASC`,
      productIds
    );
    const map = {};
    for (const row of rows) {
      if (!map[row.product_id]) map[row.product_id] = [];
      map[row.product_id].push({ id: row.id, name: row.name });
    }
    return map;
  },

  async setProductCategories(productId, categoryIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM product_categories WHERE product_id = $1', [productId]);
      for (const catId of categoryIds) {
        await client.query(
          'INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)',
          [productId, catId]
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

module.exports = CategoryModel;
