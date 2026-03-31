const db = require('../db/connection');

const CategoryModel = {
  findAll() {
    return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },

  create(name) {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    return result.lastInsertRowid;
  },

  update(id, name) {
    const result = db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
    return result.changes > 0;
  },

  delete(id) {
    db.prepare('DELETE FROM product_categories WHERE category_id = ?').run(id);
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return result.changes > 0;
  },

  findByProductId(productId) {
    return db.prepare(
      `SELECT c.* FROM categories c
       JOIN product_categories pc ON pc.category_id = c.id
       WHERE pc.product_id = ?
       ORDER BY c.name ASC`
    ).all(productId);
  },

  setProductCategories(productId, categoryIds) {
    const del = db.prepare('DELETE FROM product_categories WHERE product_id = ?');
    const ins = db.prepare('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)');

    const run = db.transaction(() => {
      del.run(productId);
      for (const catId of categoryIds) {
        ins.run(productId, catId);
      }
    });
    run();
  },
};

module.exports = CategoryModel;
