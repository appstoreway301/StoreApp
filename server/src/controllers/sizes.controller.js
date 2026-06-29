const SizeModel = require('../models/size.model');

async function getAll(req, res, next) {
  try {
    const sizes = await SizeModel.findAll();
    res.json({ sizes });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la talla es requerido' });
    }
    const id = await SizeModel.create(name.trim(), sort_order || 0);
    const size = await SizeModel.findById(id);
    res.status(201).json({ size });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Esta talla ya existe' });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la talla es requerido' });
    }
    const updated = await SizeModel.update(id, { name: name.trim(), sortOrder: sort_order || 0 });
    if (!updated) {
      return res.status(404).json({ error: 'Talla no encontrada' });
    }
    const size = await SizeModel.findById(id);
    res.json({ size });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Esta talla ya existe' });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await SizeModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Talla no encontrada' });
    }
    res.json({ message: 'Talla eliminada' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, delete: remove };