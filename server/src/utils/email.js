const nodemailer = require('nodemailer');
const config = require('../config/env');

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

async function sendOrderNotification({ order, items, customerEmail }) {
  const sellerEmail = process.env.SMTP_FROM || 'onboarding@resend.dev';

  const itemRows = items.map(item =>
    `<tr>
      <td style="padding:8px;border:1px solid #ddd;">${item.product_name}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">$${(item.price_cents / 100).toFixed(2)}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">$${((item.price_cents * item.quantity) / 100).toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
    <h2>New Order #${order.id}</h2>
    <p><strong>Customer:</strong> ${customerEmail}</p>
    <p><strong>Date:</strong> ${order.created_at}</p>
    <p><strong>Status:</strong> ${order.status}</p>
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

module.exports = { sendVerificationEmail, sendOrderNotification };
