const ProductModel = require('../models/product.model');
const ProductImageModel = require('../models/product-image.model');
const CategoryModel = require('../models/category.model');

function list(req, res, next) {
  try {
    const { category } = req.query;
    const products = ProductModel.findAll(category || null);
    const result = products.map(p => ({
      ...p,
      categories: CategoryModel.findByProductId(p.id),
    }));
    res.json({ products: result });
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const product = ProductModel.findById(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const images = ProductImageModel.findByProductId(product.id);
    const categories = CategoryModel.findByProductId(product.id);
    res.json({ product: { ...product, images, categories } });
  } catch (err) {
    next(err);
  }
}

function listCategories(req, res, next) {
  try {
    const categories = CategoryModel.findAll();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, listCategories };
