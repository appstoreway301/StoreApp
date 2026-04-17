const stripe = require('../utils/stripe');
const config = require('../config/env');
const CartModel = require('../models/cart.model');
const OrderModel = require('../models/order.model');
const ProductModel = require('../models/product.model');
const UserModel = require('../models/user.model');
const { sendOrderNotification, sendOrderConfirmationToCustomer } = require('../utils/email');

async function createSession(req, res, next) {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    const { shipping } = req.body;
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

    const totalCents = cartItems.reduce(
      (sum, item) => sum + item.price_cents * item.quantity, 0
    );

    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: item.price_cents,
      },
      quantity: item.quantity,
    }));

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

    await OrderModel.create(req.userId, totalCents, orderItems, session.id, shipping);

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
