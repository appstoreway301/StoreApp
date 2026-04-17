const nodemailer = require('nodemailer');
const config = require('../config/env');

// Escape HTML special characters to prevent XSS in email templates.
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

let transporter = null;

if (process.env.SMTP_HOST) {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(to, token) {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'onboarding@resend.dev',
      to,
      subject: 'Verify your email - StoreApp',
      html: `<p>Click the link to verify your email:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
    });
  } else {
    console.log('\n========================================');
    console.log('📧 VERIFICATION EMAIL');
    console.log(`To: ${to}`);
    console.log(`Link: ${verifyUrl}`);
    console.log('========================================\n');
  }
}

async function sendOrderNotification({ order, items, customerEmail, shipping }) {
  const sellerEmail = process.env.SMTP_FROM || 'onboarding@resend.dev';

  const itemRows = items.map(item =>
    `<tr>
      <td style="padding:8px;border:1px solid #ddd;">${escHtml(item.product_name)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">${escHtml(item.quantity)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">$${(item.price_cents / 100).toFixed(2)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">$${((item.price_cents * item.quantity) / 100).toFixed(2)}</td>
    </tr>`
  ).join('');

  const shippingHtml = shipping && shipping.name ? `
    <h3>Shipping Address</h3>
    <p style="margin:0;line-height:1.6;">
      <strong>${escHtml(shipping.name)}</strong><br>
      ${escHtml(shipping.address)}<br>
      ${escHtml(shipping.city)}, ${escHtml(shipping.state)} ${escHtml(shipping.zip)}<br>
      ${escHtml(shipping.country)}<br>
      ${shipping.phone ? `Phone: ${escHtml(shipping.phone)}` : ''}
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
  ` : '';

  const html = `
    <h2>New Order #${escHtml(order.id)}</h2>
    <p><strong>Customer:</strong> ${escHtml(customerEmail)}</p>
    <p><strong>Date:</strong> ${escHtml(order.created_at)}</p>
    <p><strong>Status:</strong> ${escHtml(order.status)}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
    ${shippingHtml}
    <table style="border-collapse:collapse;width:100%;">
      <thead>
        <tr style="background:#f4f4f4;">
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Product</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:center;">Qty</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:right;">Price</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <h3 style="text-align:right;">Total: $${(order.total_cents / 100).toFixed(2)}</h3>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: sellerEmail,
      to: sellerEmail,
      subject: `New Order #${order.id} - $${(order.total_cents / 100).toFixed(2)}`,
      html,
    });
  } else {
    console.log('\n========================================');
    console.log('🛒 NEW ORDER NOTIFICATION');
    console.log(`Order #${order.id} - Customer: ${customerEmail}`);
    console.log(`Total: $${(order.total_cents / 100).toFixed(2)}`);
    console.log('========================================\n');
  }
}

async function sendOrderConfirmationToCustomer({ order, items, customerEmail, shipping }) {
  const itemRows = items.map(item =>
    `<tr>
      <td style="padding:8px;border:1px solid #ddd;">${escHtml(item.product_name)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">${escHtml(item.quantity)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">$${(item.price_cents / 100).toFixed(2)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">$${((item.price_cents * item.quantity) / 100).toFixed(2)}</td>
    </tr>`
  ).join('');

  const shippingHtml = shipping && shipping.name ? `
    <p style="margin:0;line-height:1.6;">
      <strong>${escHtml(shipping.name)}</strong><br>
      ${escHtml(shipping.address)}<br>
      ${escHtml(shipping.city)}, ${escHtml(shipping.state)} ${escHtml(shipping.zip)}<br>
      ${escHtml(shipping.country)}<br>
      ${shipping.phone ? `Tel: ${escHtml(shipping.phone)}` : ''}
    </p>
  ` : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#4CAF50;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:24px;">Thank you for your purchase!</h1>
      </div>
      <div style="padding:20px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
        <p>Hi <strong>${escHtml(shipping?.name || 'Customer')}</strong>,</p>
        <p>Your order <strong>#${escHtml(order.id)}</strong> has been confirmed and is being prepared.</p>

        <h3 style="border-bottom:2px solid #4CAF50;padding-bottom:8px;">Order Details</h3>
        <table style="border-collapse:collapse;width:100%;">
          <thead>
            <tr style="background:#f4f4f4;">
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Product</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center;">Qty</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:right;">Price</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <h3 style="text-align:right;color:#4CAF50;">Total: $${(order.total_cents / 100).toFixed(2)} USD</h3>

        ${shippingHtml ? `<h3 style="border-bottom:2px solid #4CAF50;padding-bottom:8px;">Shipping Address</h3>${shippingHtml}` : ''}

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#666;font-size:14px;">If you have any questions about your order, feel free to contact us.</p>
        <p style="color:#666;font-size:14px;">Thank you for shopping with us!</p>
      </div>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'onboarding@resend.dev',
      to: customerEmail,
      subject: `Order Confirmed #${order.id} - $${(order.total_cents / 100).toFixed(2)}`,
      html,
    });
  } else {
    console.log('\n========================================');
    console.log('📧 ORDER CONFIRMATION TO CUSTOMER');
    console.log(`To: ${customerEmail}`);
    console.log(`Order #${order.id} - Total: $${(order.total_cents / 100).toFixed(2)}`);
    console.log('========================================\n');
  }
}

module.exports = { sendVerificationEmail, sendOrderNotification, sendOrderConfirmationToCustomer };
