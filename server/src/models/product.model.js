const db = require('../db/connection');

const ProductModel = {
  findAll(categoryId) {
    if (categoryId) {
      return db.prepare(
        `SELECT DISTINCT p.* FROM products p
         JOIN product_categories pc ON pc.product_id = p.id
         WHERE p.active = 1 AND pc.category_id = ?
         ORDER BY p.created_at DESC`
      ).all(categoryId);
    }
    return db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC').all();
  },

  findAllAdmin() {
    return db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(id);
  },

  findByIdAdmin(id) {
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  findByIds(ids) {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    return db.prepare(`SELECT * FROM products WHERE id IN (${placeholders}) AND active = 1`).all(...ids);
  },

  create({ name, description, priceCents, imageUrl, category, stock }) {
    const result = db.prepare(
      'INSERT INTO products (name, description, price_cents, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, description, priceCents, imageUrl, category, stock);
    return result.lastInsertRowid;
  },

  update(id, { name, description, priceCents, imageUrl, category, stock, active }) {
    const result = db.prepare(
      'UPDATE products SET name = ?, description = ?, price_cents = ?, image_url = ?, category = ?, stock = ?, active = ? WHERE id = ?'
    ).run(name, description, priceCents, imageUrl, category, stock, active, id);
    return result.changes > 0;
  },

  reduceStock(id, quantity) {
    db.prepare(
      'UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?'
    ).run(quantity, id);
  },

  delete(id) {
    const result = db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

module.exports = ProductModel;
