const bcrypt = require('bcrypt');
const pool = require('./connection');
const migrate = require('./migrate');

async function seed() {
  await migrate();

  // Seed admin account
  const adminEmail = 'appstoreway301@gmail.com';
  const { rows: existingAdmin } = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

  if (existingAdmin.length === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 12);
    await pool.query(
      'INSERT INTO users (email, password_hash, name, role, email_verified) VALUES ($1, $2, $3, $4, TRUE)',
      [adminEmail, passwordHash, 'Admin', 'admin']
    );
    console.log('Admin account created (email: appstoreway301@gmail.com, password: admin123)');
  } else {
    await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', adminEmail]);
    console.log('Admin account already exists, ensured admin role.');
  }

  const products = [
    { name: 'Wireless Headphones', description: 'Noise-cancelling over-ear headphones with 30h battery life.', price_cents: 7999, image_url: 'https://placehold.co/400x400?text=Headphones', category: 'Electronics', stock: 25 },
    { name: 'Mechanical Keyboard', description: 'RGB backlit mechanical keyboard with Cherry MX switches.', price_cents: 12999, image_url: 'https://placehold.co/400x400?text=Keyboard', category: 'Electronics', stock: 15 },
    { name: 'USB-C Hub', description: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader.', price_cents: 3499, image_url: 'https://placehold.co/400x400?text=USB-C+Hub', category: 'Electronics', stock: 40 },
    { name: 'Running Shoes', description: 'Lightweight mesh running shoes with responsive cushioning.', price_cents: 8999, image_url: 'https://placehold.co/400x400?text=Shoes', category: 'Footwear', stock: 30 },
    { name: 'Canvas Backpack', description: 'Water-resistant canvas backpack, 25L capacity.', price_cents: 4999, image_url: 'https://placehold.co/400x400?text=Backpack', category: 'Accessories', stock: 20 },
    { name: 'Stainless Steel Bottle', description: 'Double-wall insulated bottle, keeps drinks cold 24h.', price_cents: 2499, image_url: 'https://placehold.co/400x400?text=Bottle', category: 'Accessories', stock: 50 },
    { name: 'LED Desk Lamp', description: 'LED desk lamp with adjustable brightness and color temperature.', price_cents: 3999, image_url: 'https://placehold.co/400x400?text=Lamp', category: 'Home', stock: 35 },
    { name: 'Notebook Set', description: 'Set of 3 lined notebooks, 200 pages each.', price_cents: 1499, image_url: 'https://placehold.co/400x400?text=Notebooks', category: 'Home', stock: 60 },
    { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with adjustable DPI.', price_cents: 2999, image_url: 'https://placehold.co/400x400?text=Mouse', category: 'Electronics', stock: 45 },
    { name: 'Polarized Sunglasses', description: 'Polarized UV400 sunglasses with lightweight frame.', price_cents: 1999, image_url: 'https://placehold.co/400x400?text=Sunglasses', category: 'Accessories', stock: 55 },
  ];

  const { rows: countResult } = await pool.query('SELECT COUNT(*) as count FROM products');
  const count = parseInt(countResult[0].count, 10);

  if (count === 0) {
    for (const p of products) {
      await pool.query(
        'INSERT INTO products (name, description, price_cents, image_url, category, stock) VALUES ($1, $2, $3, $4, $5, $6)',
        [p.name, p.description, p.price_cents, p.image_url, p.category, p.stock]
      );
    }
    console.log(`Seeded ${products.length} products.`);
  } else {
    console.log(`Products table already has ${count} rows, skipping seed.`);
  }

  // Migrate existing category text fields into categories table
  const { rows: catCountResult } = await pool.query('SELECT COUNT(*) as count FROM categories');
  const catCount = parseInt(catCountResult[0].count, 10);

  if (catCount === 0) {
    const { rows: existingCats } = await pool.query(
      "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''"
    );
    for (const { category } of existingCats) {
      await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [category]);
    }
    // Link products to categories
    const { rows: allProducts } = await pool.query(
      "SELECT id, category FROM products WHERE category IS NOT NULL AND category != ''"
    );
    for (const p of allProducts) {
      await pool.query(
        'INSERT INTO product_categories (product_id, category_id) SELECT $1, id FROM categories WHERE name = $2 ON CONFLICT DO NOTHING',
        [p.id, p.category]
      );
    }
    console.log(`Migrated ${existingCats.length} categories.`);
  }
}

seed()
  .then(() => {
    console.log('Seed completed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
