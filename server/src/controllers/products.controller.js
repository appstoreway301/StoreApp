const ProductModel = require('../models/product.model');
const ProductImageModel = require('../models/product-image.model');
const CategoryModel = require('../models/category.model');

async function list(req, res, next) {
  try {
    const { category } = req.query;
    const products = await ProductModel.findAll(category || null);
    const ids = products.map(p => p.id);
    const categoriesMap = await CategoryModel.findByProductIds(ids);
    const result = products.map(p => ({
      ...p,
      categories: categoriesMap[p.id] || [],
    }));
    res.json({ products: result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const product = await ProductModel.findById(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const images = await ProductImageModel.findByProductId(product.id);
    const categories = await CategoryModel.findByProductId(product.id);
    res.json({ product: { ...product, images, categories } });
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const categories = await CategoryModel.findAll();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, listCategories };
