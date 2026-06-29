const ColorModel = require('../models/color.model');

async function getAll(req, res, next) {
  try {
    const colors = await ColorModel.findAll();
    res.json({ colors });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, hex_code, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del color es requerido' });
    }
    const id = await ColorModel.create(name.trim(), hex_code || null, sort_order || 0);
    const color = await ColorModel.findById(id);
    res.status(201).json({ color });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Este color ya existe' });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, hex_code, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del color es requerido' });
    }
    const updated = await ColorModel.update(id, { 
      name: name.trim(), 
      hexCode: hex_code || null, 
      sortOrder: sort_order || 0 
    });
    if (!updated) {
      return res.status(404).json({ error: 'Color no encontrado' });
    }
    const color = await ColorModel.findById(id);
    res.json({ color });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Este color ya existe' });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await ColorModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Color no encontrado' });
    }
    res.json({ message: 'Color eliminado' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, delete: remove };