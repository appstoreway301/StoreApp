const stripe = require('../utils/stripe');
const config = require('../config/env');
const CartModel = require('../models/cart.model');
const OrderModel = require('../models/order.model');
const ProductModel = require('../models/product.model');
const UserModel = require('../models/user.model');
const ShipmentModel = require('../models/shipment.model');
const { envia, getOrigin, buildPackages, abbreviateState } = require('../utils/envia');
const { sendOrderNotification, sendOrderConfirmationToCustomer } = require('../utils/email');

async function createSession(req, res, next) {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    const { shipping, shippingQuote } = req.body;
    if (!shipping || !shipping.name || !shipping.address || !shipping.city || !shipping.state || !shipping.zip || !shipping.country) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }

    const cartItems = await CartModel.getByUserId(req.userId);
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${item.name}". Available: ${item.stock}`,
        });
      }
    }

    // Validate carrier availability with Envia BEFORE payment (free, no label generated)
    if (envia && shippingQuote?.carrier) {
      try {
        const origin = getOrigin();
        const packages = buildPackages(cartItems);
        await envia.post('/ship/rate/', {
          origin,
          destination: {
            name: shipping.name,
            phone: shipping.phone || '',
            street: shipping.address,
            number: 'S/N',
            city: shipping.city,
            state: abbreviateState(shipping.state),
            country: shipping.country,
            postalCode: shipping.zip,
          },
          packages,
          shipment: { type: 1, carrier: shippingQuote.carrier },
        });
      } catch (err) {
        const enviaMsg = err.response?.data?.error?.message || err.message;
        console.error('[Envia] Pre-checkout validation failed:', enviaMsg);
        return res.status(400).json({
          error: `${shippingQuote.carrier.toUpperCase()} is currently unavailable: ${enviaMsg}. Please select a different shipping method.`,
          carrierError: true,
        });
      }
    }

    const productsCents = cartItems.reduce(
      (sum, item) => sum + item.price_cents * item.quantity, 0
    );
    const shippingCostCents = shippingQuote?.amountCents || 0;
    const totalCents = productsCents + shippingCostCents;

    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: item.price_cents,
      },
      quantity: item.quantity,
    }));

    if (shippingCostCents > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: `Envio (${shippingQuote.carrier} - ${shippingQuote.service})` },
          unit_amount: shippingCostCents,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${config.clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/checkout/cancel`,
      client_reference_id: req.userId.toString(),
    });

    const orderItems = cartItems.map(item => ({
      product_id: item.product_id,
      name: item.name,
      price_cents: item.price_cents,
      quantity: item.quantity,
    }));

    await OrderModel.create(req.userId, totalCents, orderItems, session.id, shipping, shippingQuote || {});

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
}

// Lógica post-pago compartida entre webhook y verifySession.
// markProcessed garantiza que solo se ejecuta una vez por orden.
async function processOrder(order) {
  const locked = await OrderModel.markProcessed(order.id);
  if (!locked) return; // Ya fue procesada por el otro flujo

  const items = await OrderModel.findItemsByOrderId(order.id);
  for (const item of items) {
    await ProductModel.reduceStock(item.product_id, item.quantity);
  }
  await CartModel.clearCart(order.user_id);

  const user = await UserModel.findById(order.user_id);
  const emailData = {
    order,
    items,
    customerEmail: user?.email || 'Unknown',
    shipping: {
      name: order.shipping_name,
      address: order.shipping_address,
      city: order.shipping_city,
      state: order.shipping_state,
      zip: order.shipping_zip,
      country: order.shipping_country,
      phone: order.shipping_phone,
    },
  };

  // Generate shipping label via Envia AFTER payment confirmed
  let shipmentInfo = null;
  if (envia && order.shipping_carrier) {
    try {
      await ShipmentModel.create(order.id, order.shipping_carrier, order.shipping_service || '');

      const origin = getOrigin();
      const packages = buildPackages(items.map(i => ({
        name: i.product_name,
        quantity: i.quantity,
        weight_kg: null,
      })));

      const generatePayload = {
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
          carrier: order.shipping_carrier,
          service: order.shipping_service || undefined,
        },
        settings: {
          currency: 'MXN',
          printFormat: 'PDF',
          printSize: 'STOCK_4X6',
          comments: `Order #${order.id}`,
        },
      };

      console.log('[Envia] Generating label (post-payment):', JSON.stringify(generatePayload));
      const response = await envia.post('/ship/generate/', generatePayload);
      console.log('[Envia] Label generated OK:', JSON.stringify(response.data));

      const gen = response.data?.data || response.data;
      shipmentInfo = await ShipmentModel.updateAfterGenerate(order.id, {
        enviaShipmentId: gen.shipmentId || gen.shipment_id || '',
        trackingNumber: gen.trackingNumber || gen.tracking_number || '',
        trackUrl: gen.trackUrl || gen.track_url || '',
        labelUrl: gen.label || gen.label_url || '',
      });
    } catch (err) {
      console.error('Envia label generation failed (post-payment):', err.response?.data || err.message);
      await ShipmentModel.setError(order.id, JSON.stringify(err.response?.data) || err.message);
    }
  }

  emailData.shipment = shipmentInfo;

  sendOrderNotification(emailData)
    .catch(err => console.error('Failed to send order notification:', err.message));
  sendOrderConfirmationToCustomer(emailData)
    .catch(err => console.error('Failed to send customer confirmation:', err.message));
}

async function handleWebhook(req, res, next) {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await OrderModel.updateStatus(session.id, 'paid', session.payment_intent);

      const order = await OrderModel.findByStripeSessionId(session.id);
      if (order) {
        await processOrder(order);
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await OrderModel.updateStatus(session.id, 'failed', null);
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object;
      await OrderModel.updateStatus(session.id, 'failed', null);
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

async function verifySession(req, res, next) {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const order = await OrderModel.findByStripeSessionId(sessionId);
    if (!order || order.user_id !== req.userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'pending') {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        await OrderModel.updateStatus(sessionId, 'paid', session.payment_intent);
        order.status = 'paid';
        await processOrder(order);
      }
    }

    const items = await OrderModel.findItemsByOrderId(order.id);
    res.json({ order: { ...order, items } });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSession, handleWebhook, verifySession };
