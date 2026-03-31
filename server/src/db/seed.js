const bcrypt = require('bcrypt');
const db = require('./connection');
const migrate = require('./migrate');

migrate();

// Seed admin account
const adminEmail = 'appstoreway301@gmail.com';
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync('admin123', 12);
  db.prepare(
    'INSERT INTO users (email, password_hash, name, role, email_verified) VALUES (?, ?, ?, ?, 1)'
  ).run(adminEmail, passwordHash, 'Admin', 'admin');
  console.log('Admin account created (email: appstoreway301@gmail.com, password: admin123)');
} else {
  db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', adminEmail);
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

const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count;

if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, description, price_cents, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((items) => {
    for (const p of items) {
      insert.run(p.name, p.description, p.price_cents, p.image_url, p.category, p.stock);
    }
  });
  insertMany(products);
  console.log(`Seeded ${products.length} products.`);
} else {
  console.log(`Products table already has ${count} rows, skipping seed.`);
}

// Migrate existing category text fields into categories table
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
if (catCount === 0) {
  const existingCats = db.prepare('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != \'\'').all();
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  for (const { category } of existingCats) {
    insertCat.run(category);
  }
  // Link products to categories
  const allProducts = db.prepare('SELECT id, category FROM products WHERE category IS NOT NULL AND category != \'\'').all();
  const insertLink = db.prepare(
    'INSERT OR IGNORE INTO product_categories (product_id, category_id) SELECT ?, id FROM categories WHERE name = ?'
  );
  for (const p of allProducts) {
    insertLink.run(p.id, p.category);
  }
  console.log(`Migrated ${existingCats.length} categories.`);
}
