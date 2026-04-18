const AddressModel = require('../models/address.model');

async function list(req, res, next) {
  try {
    const addresses = await AddressModel.findByUserId(req.userId);
    res.json({ addresses });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const count = await AddressModel.countByUserId(req.userId);
    if (count >= AddressModel.MAX_ADDRESSES) {
      return res.status(400).json({ error: `Maximum ${AddressModel.MAX_ADDRESSES} addresses allowed` });
    }

    const { label, name, address, city, state, zip, country, phone } = req.body;
    if (!name || !address || !city || !state || !zip || !country) {
      return res.status(400).json({ error: 'All address fields are required (name, address, city, state, zip, country)' });
    }

    const isDefault = count === 0;
    const created = await AddressModel.create(req.userId, {
      label, name, address, city, state, zip, country, phone, is_default: isDefault,
    });
    res.status(201).json({ address: created });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { label, name, address, city, state, zip, country, phone, is_default } = req.body;
    if (!name || !address || !city || !state || !zip || !country) {
      return res.status(400).json({ error: 'All address fields are required' });
    }

    const updated = await AddressModel.update(id, req.userId, {
      label, name, address, city, state, zip, country, phone, is_default,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ address: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await AddressModel.delete(id, req.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ message: 'Address deleted' });
  } catch (err) {
    next(err);
  }
}

async function setDefault(req, res, next) {
  try {
    const { id } = req.params;
    const addr = await AddressModel.findById(id, req.userId);
    if (!addr) {
      return res.status(404).json({ error: 'Address not found' });
    }
    await AddressModel.update(id, req.userId, { ...addr, is_default: true });
    const addresses = await AddressModel.findByUserId(req.userId);
    res.json({ addresses });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove, setDefault };
