const UserModel = require('../models/user.model');

function requireAdmin(req, res, next) {
  const user = UserModel.findById(req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = requireAdmin;
