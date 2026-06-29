const pool = require('../db/connection');

const ProductVariantModel = {
  async findByProductId(productId) {
    const { rows } = await pool.query(
      'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY size, color',
      [productId]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM product_variants WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findBySku(sku) {
    const { rows } = await pool.query(
      'SELECT * FROM product_variants WHERE sku = $1',
      [sku]
    );
    return rows[0] || null;
  },

  async create({ productId, size, color, sku, stock, imageUrl }) {
    const { rows } = await pool.query(
      `INSERT INTO product_variants (product_id, size, color, sku, stock, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [productId, size, color, sku || `${productId}-${size}-${color}`, stock || 0, imageUrl || null]
    );
    return rows[0];
  },

  async updateStock(id, stock) {
    const { rows } = await pool.query(
      'UPDATE product_variants SET stock = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [stock, id]
    );
    return rows[0] || null;
  },

  async update(id, { size, color, sku, stock, imageUrl }) {
    const { rows } = await pool.query(
      `UPDATE product_variants 
       SET size = $1, color = $2, sku = $3, stock = $4, image_url = $5, updated_at = NOW() 
       WHERE id = $6 RETURNING *`,
      [size, color, sku, stock, imageUrl, id]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rowCount } = await pool.query(
      'DELETE FROM product_variants WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  },

  async deleteByProductId(productId) {
    const { rowCount } = await pool.query(
      'DELETE FROM product_variants WHERE product_id = $1',
      [productId]
    );
    return rowCount > 0;
  },

  async getTotalStock(productId) {
    const { rows } = await pool.query(
      'SELECT COALESCE(SUM(stock), 0) as total FROM product_variants WHERE product_id = $1',
      [productId]
    );
    return parseInt(rows[0]?.total || 0, 10);
  },

  async hasStock(id, quantity = 1) {
    const variant = await this.findById(id);
    return variant && variant.stock >= quantity;
  },

  async reduceStock(id, quantity = 1) {
    const { rows } = await pool.query(
      'UPDATE product_variants SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND stock >= $1 RETURNING *',
      [quantity, id]
    );
    return rows[0] || null;
  },

  async getAvailableSizes(productId) {
    const { rows } = await pool.query(
      'SELECT DISTINCT size FROM product_variants WHERE product_id = $1 AND stock > 0 ORDER BY size',
      [productId]
    );
    return rows.map(r => r.size);
  },

  async getAvailableColors(productId) {
    const { rows } = await pool.query(
      'SELECT DISTINCT color FROM product_variants WHERE product_id = $1 AND stock > 0 ORDER BY color',
      [productId]
    );
    return rows.map(r => r.color);
  },
};

module.exports = ProductVariantModel;