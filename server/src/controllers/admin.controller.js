const db = require('../db/connection');
const ProductModel = require('../models/product.model');
const ProductImageModel = require('../models/product-image.model');
const CategoryModel = require('../models/category.model');

// --- Products ---

function getProducts(req, res, next) {
  try {
    const products = ProductModel.findAllAdmin();
    const result = products.map(p => ({
      ...p,
      images: ProductImageModel.findByProductId(p.id),
      categories: CategoryModel.findByProductId(p.id),
    }));
    res.json({ products: result });
  } catch (err) {
    next(err);
  }
}

function createProduct(req, res, next) {
  try {
    const { name, description, price_cents, image_url, category, stock, category_ids } = req.body;
    const id = ProductModel.create({
      name,
      description: description || '',
      priceCents: price_cents,
      imageUrl: image_url || '',
      category: category || '',
      stock: stock || 0,
    });

    if (category_ids && category_ids.length > 0) {
      CategoryModel.setProductCategories(id, category_ids);
    }

    const product = ProductModel.findByIdAdmin(id);
    res.status(201).json({
      product: {
        ...product,
        images: [],
        categories: CategoryModel.findByProductId(id),
      },
    });
  } catch (err) {
    next(err);
  }
}

function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const existing = ProductModel.findByIdAdmin(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, price_cents, image_url, category, stock, active, category_ids } = req.body;
    ProductModel.update(id, {
      name: name ?? existing.name,
      description: description ?? existing.description,
      priceCents: price_cents ?? existing.price_cents,
      imageUrl: image_url ?? existing.image_url,
      category: category ?? existing.category,
      stock: stock ?? existing.stock,
      active: active ?? existing.active,
    });

    if (category_ids !== undefined) {
      CategoryModel.setProductCategories(id, category_ids || []);
    }

    const product = ProductModel.findByIdAdmin(id);
    const images = ProductImageModel.findByProductId(id);
    const categories = CategoryModel.findByProductId(id);
    res.json({ product: { ...product, images, categories } });
  } catch (err) {
    next(err);
  }
}

function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = ProductModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product removed successfully' });
  } catch (err) {
    next(err);
  }
}

// --- Product Images ---

function addProductImage(req, res, next) {
  try {
    const { id } = req.params;
    const product = ProductModel.findByIdAdmin(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const { image_url } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }
    ProductImageModel.add(id, image_url);
    const images = ProductImageModel.findByProductId(id);
    res.status(201).json({ images });
  } catch (err) {
    next(err);
  }
}

function removeProductImage(req, res, next) {
  try {
    const { imageId } = req.params;
    const removed = ProductImageModel.remove(imageId);
    if (!removed) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ message: 'Image removed' });
  } catch (err) {
    next(err);
  }
}

// --- Categories ---

function getCategories(req, res, next) {
  try {
    const categories = CategoryModel.findAll();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const id = CategoryModel.create(name.trim());
    const category = CategoryModel.findById(id);
    res.status(201).json({ category });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    next(err);
  }
}

function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const updated = CategoryModel.update(id, name.trim());
    if (!updated) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const category = CategoryModel.findById(id);
    res.json({ category });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    next(err);
  }
}

function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = CategoryModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

// --- Stock & Sales Dashboard ---

function getStockDashboard(req, res, next) {
  try {
    // All products with stock info
    const products = db.prepare(
      'SELECT id, name, image_url, stock, active FROM products ORDER BY stock ASC'
    ).all();

    // Sales summary per product (only paid orders)
    const sales = db.prepare(
      `SELECT oi.product_id, oi.product_name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price_cents) as total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status = 'paid'
       GROUP BY oi.product_id
       ORDER BY total_sold DESC`
    ).all();

    // General stats
    const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'paid'").get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_cents), 0) as total FROM orders WHERE status = 'paid'").get().total;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;
    const totalStock = db.prepare("SELECT COALESCE(SUM(stock), 0) as total FROM products WHERE active = 1").get().total;

    // Sales by date (last 30 days)
    const salesByDate = db.prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_cents) as revenue
       FROM orders
       WHERE status = 'paid' AND created_at >= datetime('now', '-30 days')
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    ).all();

    res.json({
      products,
      sales,
      salesByDate,
      stats: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        totalStock,
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
