const db = require('../db/connection');

const ProductImageModel = {
  findByProductId(productId) {
    return db.prepare(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC'
    ).all(productId);
  },

  add(productId, imageUrl) {
    const maxOrder = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM product_images WHERE product_id = ?'
    ).get(productId);
    const result = db.prepare(
      'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)'
    ).run(productId, imageUrl, maxOrder.max_order + 1);
    return result.lastInsertRowid;
  },

  remove(imageId) {
    const result = db.prepare('DELETE FROM product_images WHERE id = ?').run(imageId);
    return result.changes > 0;
  },

  removeAllByProductId(productId) {
    db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);
  },
};

module.exports = ProductImageModel;
