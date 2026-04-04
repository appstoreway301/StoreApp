const pool = require('../db/connection');

const ProductImageModel = {
  async findByProductId(productId) {
    const { rows } = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC',
      [productId]
    );
    return rows;
  },

  async findByProductIds(productIds) {
    if (productIds.length === 0) return {};
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await pool.query(
      `SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order ASC`,
      productIds
    );
    const map = {};
    for (const row of rows) {
      if (!map[row.product_id]) map[row.product_id] = [];
      map[row.product_id].push(row);
    }
    return map;
  },

  async add(productId, imageUrl) {
    const { rows: maxRows } = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM product_images WHERE product_id = $1',
      [productId]
    );
    const { rows } = await pool.query(
      'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3) RETURNING id',
      [productId, imageUrl, maxRows[0].max_order + 1]
    );
    return rows[0].id;
  },

  async remove(imageId) {
    const { rowCount } = await pool.query('DELETE FROM product_images WHERE id = $1', [imageId]);
    return rowCount > 0;
  },

  async removeAllByProductId(productId) {
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
  },
};

module.exports = ProductImageModel;
