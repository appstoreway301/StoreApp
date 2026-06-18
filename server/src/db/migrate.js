const pool = require('./connection');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token TEXT,
      refresh_token TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price_cents INTEGER NOT NULL,
      image_url TEXT,
      category TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      stripe_session_id TEXT UNIQUE,
      stripe_payment_intent TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      total_cents INTEGER NOT NULL,
      shipping_name TEXT DEFAULT '',
      shipping_address TEXT DEFAULT '',
      shipping_city TEXT DEFAULT '',
      shipping_state TEXT DEFAULT '',
      shipping_zip TEXT DEFAULT '',
      shipping_country TEXT DEFAULT '',
      shipping_phone TEXT DEFAULT '',
      processed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      quantity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pending_verifications (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Migración: agregar columna processed a orders si no existe
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'processed'
      ) THEN
        ALTER TABLE orders ADD COLUMN processed BOOLEAN NOT NULL DEFAULT FALSE;
      END IF;
    END $$;
  `);

  // Migración: columnas de shipping en orders para Envia
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'shipping_cost_cents'
      ) THEN
        ALTER TABLE orders ADD COLUMN shipping_cost_cents INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE orders ADD COLUMN shipping_carrier TEXT DEFAULT '';
        ALTER TABLE orders ADD COLUMN shipping_service TEXT DEFAULT '';
      END IF;
    END $$;
  `);

  // Migración: columna weight_kg en products
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'weight_kg'
      ) THEN
        ALTER TABLE products ADD COLUMN weight_kg DECIMAL(6,2) NOT NULL DEFAULT 1.00;
      END IF;
    END $$;
  `);

  // Tabla de direcciones de envío del usuario (máx 3)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT 'Home',
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'MX',
      phone TEXT DEFAULT '',
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Migrar datos de shipping de users a user_addresses si existen
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'shipping_name'
      ) THEN
        INSERT INTO user_addresses (user_id, label, name, address, city, state, zip, country, phone, is_default)
        SELECT id, 'Home', shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, COALESCE(shipping_phone, ''), TRUE
        FROM users
        WHERE shipping_name IS NOT NULL AND shipping_name != ''
        ON CONFLICT DO NOTHING;

        ALTER TABLE users DROP COLUMN IF EXISTS shipping_name;
        ALTER TABLE users DROP COLUMN IF EXISTS shipping_address;
        ALTER TABLE users DROP COLUMN IF EXISTS shipping_city;
        ALTER TABLE users DROP COLUMN IF EXISTS shipping_state;
        ALTER TABLE users DROP COLUMN IF EXISTS shipping_zip;
        ALTER TABLE users DROP COLUMN IF EXISTS shipping_country;
        ALTER TABLE users DROP COLUMN IF EXISTS shipping_phone;
      END IF;
    END $$;
  `);

  // Tabla de shipments para tracking de Envia
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id),
      envia_shipment_id TEXT,
      carrier TEXT NOT NULL,
      service TEXT,
      tracking_number TEXT,
      track_url TEXT,
      label_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Sucursales autorizadas para vender productos
  await pool.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT '',
      zip TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT 'MX',
      phone TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Inventario de productos por sucursal
  await pool.query(`
    CREATE TABLE IF NOT EXISTS branch_stock (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 0,
      UNIQUE(branch_id, product_id)
    );
  `);

  console.log('Database migrations completed.');
}

module.exports = migrate;
