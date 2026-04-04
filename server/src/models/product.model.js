const pool = require('../db/connection');

const ProductModel = {
  async findAll(categoryId) {
    if (categoryId) {
      const { rows } = await pool.query(
        `SELECT DISTINCT p.* FROM products p
         JOIN product_categories pc ON pc.product_id = p.id
         WHERE p.active = TRUE AND pc.category_id = $1
         ORDER BY p.created_at DESC`,
        [categoryId]
      );
      return rows;
    }
    const { rows } = await pool.query('SELECT * FROM products WHERE active = TRUE ORDER BY created_at DESC');
    return rows;
  },

  async findAllAdmin() {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1 AND active = TRUE', [id]);
    return rows[0] || null;
  },

  async findByIdAdmin(id) {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByIds(ids) {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await pool.query(
      `SELECT * FROM products WHERE id IN (${placeholders}) AND active = TRUE`,
      ids
    );
    return rows;
  },

  async create({ name, description, priceCents, imageUrl, category, stock }) {
    const { rows } = await pool.query(
      'INSERT INTO products (name, description, price_cents, image_url, category, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [name, description, priceCents, imageUrl, category, stock]
    );
    return rows[0].id;
  },

  async update(id, { name, description, priceCents, imageUrl, category, stock, active }) {
    const { rowCount } = await pool.query(
      'UPDATE products SET name = $1, description = $2, price_cents = $3, image_url = $4, category = $5, stock = $6, active = $7 WHERE id = $8',
      [name, description, priceCents, imageUrl, category, stock, active, id]
    );
    return rowCount > 0;
  },

  async reduceStock(id, quantity) {
    await pool.query(
      'UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2',
      [quantity, id]
    );
  },

  async delete(id) {
    const { rowCount } = await pool.query('UPDATE products SET active = FALSE WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = ProductModel;
