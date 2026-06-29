const ProductVariantModel = require('../models/product-variant.model');
const ProductModel = require('../models/product.model');

async function getByProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await ProductModel.findByIdAdmin(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const variants = await ProductVariantModel.findByProductId(productId);
    const totalStock = await ProductVariantModel.getTotalStock(productId);
    const availableSizes = await ProductVariantModel.getAvailableSizes(productId);
    const availableColors = await ProductVariantModel.getAvailableColors(productId);
    res.json({
      variants,
      totalStock,
      availableSizes,
      availableColors,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { product_id, size, color, sku, stock, image_url } = req.body;
    
    if (!product_id || !size || !color) {
      return res.status(400).json({ error: 'Product ID, size, and color are required' });
    }

    const product = await ProductModel.findByIdAdmin(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existing = await ProductVariantModel.findBySku(sku || `${product_id}-${size}-${color}`);
    if (existing) {
      return res.status(409).json({ error: 'Variant with this SKU already exists' });
    }

    const variant = await ProductVariantModel.create({
      productId: product_id,
      size,
      color,
      sku: sku || `${product_id}-${size}-${color}`,
      stock: stock || 0,
      imageUrl: image_url || null,
    });

    console.log('✅ Variante creada con imagen:', variant.image_url); // 👈 Log para depurar

    res.status(201).json({ variant });
  } catch (err) {
    console.error('❌ Error en create:', err.message); // 👈 Log para depurar
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { size, color, sku, stock, image_url } = req.body;

    console.log('📝 Actualizando variante:', { id, size, color, sku, stock, image_url }); // 👈 Log para depurar

    const variant = await ProductVariantModel.findById(id);
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const updated = await ProductVariantModel.update(id, { 
      size, 
      color, 
      sku, 
      stock,
      imageUrl: image_url || null,
    });

    console.log('✅ Variante actualizada:', updated); // 👈 Log para depurar

    res.json({ variant: updated });
  } catch (err) {
    console.error('❌ Error en update:', err.message); // 👈 Log para depurar
    next(err);
  }
}

async function updateStock(req, res, next) {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ error: 'Stock must be a non-negative number' });
    }

    const variant = await ProductVariantModel.findById(id);
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const updated = await ProductVariantModel.updateStock(id, stock);
    res.json({ variant: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await ProductVariantModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    res.json({ message: 'Variant deleted' });
  } catch (err) {
    next(err);
  }
}

async function deleteByProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await ProductModel.findByIdAdmin(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    await ProductVariantModel.deleteByProductId(productId);
    res.json({ message: 'All variants deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getByProduct,
  create,
  update,
  updateStock,
  delete: remove,
  deleteByProduct,
};