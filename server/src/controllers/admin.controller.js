const pool = require('../db/connection');
const ProductModel = require('../models/product.model');
const ProductImageModel = require('../models/product-image.model');
const CategoryModel = require('../models/category.model');

// --- Products ---

async function getProducts(req, res, next) {
  try {
    const products = await ProductModel.findAllAdmin();
    const ids = products.map(p => p.id);
    const [imagesMap, categoriesMap] = await Promise.all([
      ProductImageModel.findByProductIds(ids),
      CategoryModel.findByProductIds(ids),
    ]);
    const result = products.map(p => ({
      ...p,
      images: imagesMap[p.id] || [],
      categories: categoriesMap[p.id] || [],
    }));
    res.json({ products: result });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const { name, description, price_cents, image_url, category, stock, category_ids } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (typeof price_cents !== 'number' || !Number.isInteger(price_cents) || price_cents < 0) {
      return res.status(400).json({ error: 'price_cents must be a non-negative integer' });
    }
    if (stock !== undefined && (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0)) {
      return res.status(400).json({ error: 'stock must be a non-negative integer' });
    }

    const id = await ProductModel.create({
      name: name.trim(),
      description: description || '',
      priceCents: price_cents,
      imageUrl: image_url || '',
      category: category || '',
      stock: stock || 0,
    });

    if (category_ids && category_ids.length > 0) {
      await CategoryModel.setProductCategories(id, category_ids);
    }

    const product = await ProductModel.findByIdAdmin(id);
    res.status(201).json({
      product: {
        ...product,
        images: [],
        categories: await CategoryModel.findByProductId(id),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await ProductModel.findByIdAdmin(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, price_cents, image_url, category, stock, active, category_ids } = req.body;

    if (price_cents !== undefined && (typeof price_cents !== 'number' || !Number.isInteger(price_cents) || price_cents < 0)) {
      return res.status(400).json({ error: 'price_cents must be a non-negative integer' });
    }
    if (stock !== undefined && (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0)) {
      return res.status(400).json({ error: 'stock must be a non-negative integer' });
    }
    await ProductModel.update(id, {
      name: name ?? existing.name,
      description: description ?? existing.description,
      priceCents: price_cents ?? existing.price_cents,
      imageUrl: image_url ?? existing.image_url,
      category: category ?? existing.category,
      stock: stock ?? existing.stock,
      active: active ?? existing.active,
    });

    if (category_ids !== undefined) {
      await CategoryModel.setProductCategories(id, category_ids || []);
    }

    const product = await ProductModel.findByIdAdmin(id);
    const images = await ProductImageModel.findByProductId(id);
    const categories = await CategoryModel.findByProductId(id);
    res.json({ product: { ...product, images, categories } });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await ProductModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product removed successfully' });
  } catch (err) {
    next(err);
  }
}

// --- Product Images ---

async function addProductImage(req, res, next) {
  try {
    const { id } = req.params;
    const product = await ProductModel.findByIdAdmin(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const { image_url } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }
    await ProductImageModel.add(id, image_url);
    const images = await ProductImageModel.findByProductId(id);
    res.status(201).json({ images });
  } catch (err) {
    next(err);
  }
}

async function removeProductImage(req, res, next) {
  try {
    const { imageId } = req.params;
    const removed = await ProductImageModel.remove(imageId);
    if (!removed) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ message: 'Image removed' });
  } catch (err) {
    next(err);
  }
}

// --- Categories ---

async function getCategories(req, res, next) {
  try {
    const categories = await CategoryModel.findAll();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const id = await CategoryModel.create(name.trim());
    const category = await CategoryModel.findById(id);
    res.status(201).json({ category });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const updated = await CategoryModel.update(id, name.trim());
    if (!updated) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const category = await CategoryModel.findById(id);
    res.json({ category });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await CategoryModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

// --- Stock & Sales Dashboard ---

async function getStockDashboard(req, res, next) {
  try {
    const { rows: products } = await pool.query(
      'SELECT id, name, image_url, stock, active FROM products ORDER BY stock ASC'
    );

    const { rows: sales } = await pool.query(
      `SELECT oi.product_id, oi.product_name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price_cents) as total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status = 'paid'
       GROUP BY oi.product_id, oi.product_name
       ORDER BY total_sold DESC`
    );

    const { rows: [{ count: totalOrders }] } = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'paid'"
    );
    const { rows: [{ total: totalRevenue }] } = await pool.query(
      "SELECT COALESCE(SUM(total_cents), 0) as total FROM orders WHERE status = 'paid'"
    );
    const { rows: [{ count: pendingOrders }] } = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
    );
    const { rows: [{ total: totalStock }] } = await pool.query(
      "SELECT COALESCE(SUM(stock), 0) as total FROM products WHERE active = TRUE"
    );

    const { rows: salesByDate } = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_cents) as revenue
       FROM orders
       WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({
      products,
      sales,
      salesByDate,
      stats: {
        totalOrders: parseInt(totalOrders, 10),
        totalRevenue: parseInt(totalRevenue, 10),
        pendingOrders: parseInt(pendingOrders, 10),
        totalStock: parseInt(totalStock, 10),
        outOfStock: products.filter(p => p.stock === 0 && p.active).length,
        lowStock: products.filter(p => p.stock > 0 && p.stock <= 5 && p.active).length,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts, createProduct, updateProduct, deleteProduct,
  addProductImage, removeProductImage,
  getCategories, createCategory, updateCategory, deleteCategory,
  getStockDashboard,
};
