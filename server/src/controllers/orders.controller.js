const OrderModel = require('../models/order.model');

function list(req, res, next) {
  try {
    const orders = OrderModel.findByUserId(req.userId);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const order = OrderModel.findByIdAndUserId(Number(req.params.id), req.userId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = OrderModel.findItemsByOrderId(order.id);
    res.json({ order: { ...order, items } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById };
