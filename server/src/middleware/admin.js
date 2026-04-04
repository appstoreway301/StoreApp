const UserModel = require('../models/user.model');

async function requireAdmin(req, res, next) {
  const user = await UserModel.findById(req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = requireAdmin;
