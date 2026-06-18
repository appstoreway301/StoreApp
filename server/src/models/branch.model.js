const pool = require('../db/connection');

const BranchModel = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM branches ORDER BY name ASC');
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM branches WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create({ name, address, city, state, zip, country, phone }) {
    const { rows } = await pool.query(
      `INSERT INTO branches (name, address, city, state, zip, country, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name, address || '', city || '', state || '', zip || '', country || 'MX', phone || '']
    );
    return rows[0].id;
  },

  async update(id, { name, address, city, state, zip, country, phone, active }) {
    const { rowCount } = await pool.query(
      `UPDATE branches
       SET name = $1, address = $2, city = $3, state = $4, zip = $5, country = $6, phone = $7, active = $8
       WHERE id = $9`,
      [name, address || '', city || '', state || '', zip || '', country || 'MX', phone || '', active, id]
    );
    return rowCount > 0;
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM branches WHERE id = $1', [id]);
    return rowCount > 0;
  },

  // Inventario de la sucursal con datos del producto (incluye productos sin registro de stock)
  async getStock(branchId) {
    const { rows } = await pool.query(
      `SELECT p.id AS product_id, p.name, p.image_url, p.active,
              COALESCE(bs.quantity, 0) AS quantity
       FROM products p
       LEFT JOIN branch_stock bs ON bs.product_id = p.id AND bs.branch_id = $1
       WHERE p.active = TRUE
       ORDER BY p.name ASC`,
      [branchId]
    );
    return rows;
  },

  // Estadísticas de inventario agregadas por la base de datos para una sucursal
  async getStockStats(branchId) {
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(COALESCE(bs.quantity, 0)), 0) AS total_stock,
         COUNT(*) FILTER (WHERE COALESCE(bs.quantity, 0) = 0) AS out_of_stock,
         COUNT(*) FILTER (WHERE COALESCE(bs.quantity, 0) BETWEEN 1 AND 5) AS low_stock,
         COUNT(*) FILTER (WHERE COALESCE(bs.quantity, 0) > 5) AS in_stock,
         COUNT(*) AS total_products
       FROM products p
       LEFT JOIN branch_stock bs ON bs.product_id = p.id AND bs.branch_id = $1
       WHERE p.active = TRUE`,
      [branchId]
    );
    const r = rows[0];
    return {
      totalStock: parseInt(r.total_stock, 10),
      outOfStock: parseInt(r.out_of_stock, 10),
      lowStock: parseInt(r.low_stock, 10),
      inStock: parseInt(r.in_stock, 10),
      totalProducts: parseInt(r.total_products, 10),
    };
  },

  // Upsert de stock de un producto en una sucursal
  async setStock(branchId, productId, quantity) {
    await pool.query(
      `INSERT INTO branch_stock (branch_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (branch_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity`,
      [branchId, productId, quantity]
    );
  },
};

module.exports = BranchModel;
