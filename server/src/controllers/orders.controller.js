const OrderModel = require('../models/order.model');
const ShipmentModel = require('../models/shipment.model');

async function list(req, res, next) {
  try {
    const orders = await OrderModel.findByUserId(req.userId);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const order = await OrderModel.findByIdAndUserId(Number(req.params.id), req.userId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await OrderModel.findItemsByOrderId(order.id);
    const shipment = await ShipmentModel.findByOrderId(order.id);
    res.json({ order: { ...order, items, shipment } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById };
