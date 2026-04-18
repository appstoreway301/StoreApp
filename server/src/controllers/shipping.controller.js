const { envia, getOrigin, buildPackages, abbreviateState } = require('../utils/envia');
const CartModel = require('../models/cart.model');
const OrderModel = require('../models/order.model');
const ShipmentModel = require('../models/shipment.model');

const config = require('../config/env');

const DEFAULT_CARRIERS = ['fedex', 'dhl', 'estafeta'];

function getCarriers() {
  if (config.enviaCarriers) {
    return config.enviaCarriers.split(',').map(c => c.trim().toLowerCase());
  }
  return DEFAULT_CARRIERS;
}

async function getQuotes(req, res, next) {
  try {
    if (!envia) {
      return res.status(503).json({ error: 'Shipping service not configured' });
    }

    const { destination } = req.body;
    destination.state = abbreviateState(destination.state);
    const origin = getOrigin();

    const cartItems = await CartModel.getByUserId(req.userId);
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const packages = buildPackages(cartItems);
    const quotes = [];

    console.log('[Envia] Quoting with origin:', JSON.stringify(origin));
    console.log('[Envia] Destination:', JSON.stringify(destination));
    console.log('[Envia] Packages:', JSON.stringify(packages));

    const carriers = getCarriers();
    const ratePromises = carriers.map(async (carrier) => {
      try {
        const response = await envia.post('/ship/rate/', {
          origin,
          destination,
          packages,
          shipment: { type: 1, carrier },
        });

        console.log(`[Envia] ${carrier} response:`, JSON.stringify(response.data));

        const data = response.data?.data;
        if (Array.isArray(data)) {
          for (const rate of data) {
            quotes.push({
              carrier: rate.carrier || carrier,
              service: rate.service || '',
              deliveryEstimate: rate.deliveryEstimate || rate.delivery_estimate || '',
              priceCents: Math.round((parseFloat(rate.totalPrice || rate.total_price || 0)) * 100),
              currency: rate.currency || 'MXN',
            });
          }
        }
      } catch (err) {
        console.log(`[Envia] ${carrier} error:`, err.response?.data || err.message);
      }
    });

    await Promise.all(ratePromises);

    quotes.sort((a, b) => a.priceCents - b.priceCents);

    res.json({ quotes });
  } catch (err) {
    next(err);
  }
}

async function trackShipment(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await OrderModel.findByIdAndUserId(parseInt(orderId, 10), req.userId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const shipment = await ShipmentModel.findByOrderId(order.id);
    if (!shipment || !shipment.tracking_number) {
      return res.status(404).json({ error: 'No shipment tracking available for this order' });
    }

    if (!envia) {
      return res.json({
        shipment,
        events: [],
      });
    }

    try {
      const response = await envia.post('/ship/generaltrack/', {
        trackingNumbers: [shipment.tracking_number],
      });

      const trackingData = response.data?.data;
      const events = Array.isArray(trackingData) ? trackingData : [];

      res.json({ shipment, events });
    } catch {
      res.json({ shipment, events: [] });
    }
  } catch (err) {
    next(err);
  }
}

async function getShipments(req, res, next) {
  try {
    const shipments = await ShipmentModel.findAll();
    res.json({ shipments });
  } catch (err) {
    next(err);
  }
}

async function retryLabel(req, res, next) {
  try {
    if (!envia) {
      return res.status(503).json({ error: 'Shipping service not configured' });
    }

    const shipment = await ShipmentModel.findById(parseInt(req.params.id, 10));
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status !== 'error') {
      return res.status(400).json({ error: 'Only failed shipments can be retried' });
    }

    const pool = require('../db/connection');
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [shipment.order_id]);
    const order = rows[0] || null;

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await OrderModel.findItemsByOrderId(order.id);

    try {
      const origin = getOrigin();
      const packages = buildPackages(items.map(i => ({
        name: i.product_name,
        quantity: i.quantity,
        weight_kg: null,
      })));

      const response = await envia.post('/ship/generate/', {
        origin,
        destination: {
          name: order.shipping_name,
          phone: order.shipping_phone || '',
          street: order.shipping_address,
          number: 'S/N',
          city: order.shipping_city,
          state: abbreviateState(order.shipping_state),
          country: order.shipping_country,
          postalCode: order.shipping_zip,
        },
        packages,
        shipment: {
          type: 1,
          carrier: shipment.carrier,
          service: shipment.service || undefined,
        },
        settings: {
          currency: 'MXN',
          printFormat: 'PDF',
          printSize: 'STOCK_4X6',
          comments: `Order #${order.id}`,
        },
      });

      const gen = response.data?.data || response.data;

      await ShipmentModel.updateAfterGenerate(order.id, {
        enviaShipmentId: gen.shipmentId || gen.shipment_id || '',
        trackingNumber: gen.trackingNumber || gen.tracking_number || '',
        trackUrl: gen.trackUrl || gen.track_url || '',
        labelUrl: gen.label || gen.label_url || '',
      });

      const updated = await ShipmentModel.findByOrderId(order.id);
      res.json({ shipment: updated });
    } catch (err) {
      await ShipmentModel.setError(order.id, err.message);
      return res.status(502).json({ error: 'Label generation failed: ' + err.message });
    }
  } catch (err) {
    next(err);
  }
}

async function cancelShipment(req, res, next) {
  try {
    if (!envia) {
      return res.status(503).json({ error: 'Shipping service not configured' });
    }

    const shipment = await ShipmentModel.findById(parseInt(req.params.id, 10));
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (!shipment.tracking_number) {
      return res.status(400).json({ error: 'No tracking number to cancel' });
    }

    try {
      await envia.post('/ship/cancel/', {
        carrier: shipment.carrier,
        trackingNumber: shipment.tracking_number,
      });
    } catch {
      // Envia cancel may fail but we still mark as cancelled locally
    }

    await ShipmentModel.updateStatus(shipment.id, 'cancelled');
    res.json({ message: 'Shipment cancelled' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getQuotes, trackShipment, getShipments, retryLabel, cancelShipment };
