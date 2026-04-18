# StoreApp - E-Commerce Platform

## Objetivo del Proyecto
StoreApp es una plataforma e-commerce full-stack donde los usuarios pueden navegar productos, gestionar carritos de compra, completar compras con integración de pagos Stripe y administrar el catálogo desde un panel admin.

## Tech Stack
- **Frontend**: React 19 + Vite 8 + React Router 7 + Axios + Context API (Auth, Cart, Theme)
- **Backend**: Node.js + Express 4 + PostgreSQL (pg) + JWT + Zod
- **Pagos**: Stripe (checkout sessions + webhooks)
- **Email**: Nodemailer SMTP (verificación de cuenta, confirmación de orden al cliente y vendedor)
- **Uploads**: Multer (imágenes de productos y avatares, validación MIME + límite de tamaño)
- **Seguridad**: Helmet, CORS, bcrypt, express-rate-limit
- **Deploy**: Soporte Cloudflare Tunnel (CORS, proxy Vite, resolución de URLs)

## Estructura del Proyecto
```
StoreApp/
├── client/          # React SPA (puerto 5173)
│   ├── src/
│   │   ├── api/         # Axios client con interceptores JWT y refresh automático
│   │   ├── context/     # AuthContext, CartContext, ThemeContext (dark mode)
│   │   ├── components/  # Layout, Navbar, Footer, ProductCard, CartItem,
│   │   │                # ProtectedRoute, AdminRoute, ParticleBackground
│   │   ├── pages/       # Home, Product, Login, Register, VerifyEmail,
│   │   │                # CompleteRegistration, Cart, CheckoutSuccess,
│   │   │                # CheckoutCancel, Profile, Orders,
│   │   │                # Admin, AdminProducts, AdminCategories, AdminStock
│   │   └── utils/       # imageUrl (resolución URLs para tunnel/local)
│   └── vite.config.js   # Proxy /api y /uploads -> localhost:3001
├── server/          # Express API (puerto 3001)
│   ├── src/
│   │   ├── config/      # Variables de entorno
│   │   ├── db/          # Conexión PostgreSQL, migraciones, seed
│   │   ├── models/      # user, product, order, cart, category,
│   │   │                # product-image, pending-verification
│   │   ├── controllers/ # auth, products, cart, checkout, orders, admin
│   │   ├── routes/      # Definición de endpoints
│   │   ├── middleware/   # auth (JWT), admin (rol), validate (Zod), errorHandler
│   │   ├── schemas/     # Validaciones Zod (auth, cart, checkout)
│   │   └── utils/       # jwt, stripe, email
│   └── data/            # DB file (store.db)
└── .env                 # Configuración (JWT secrets, Stripe keys, SMTP, DATABASE_URL)
```

## API Endpoints

### Auth (`/api/auth`)
- `POST /send-verification` - Enviar email de verificación (rate limited)
- `GET /verify-email` - Verificar email con token
- `POST /register` - Registro con email verificado (rate limited)
- `POST /login` - Login con email/password (rate limited)
- `POST /refresh` - Renovar access token
- `POST /logout` - Cerrar sesión (requiere auth)
- `GET /me` - Perfil del usuario autenticado
- `PUT /change-password` - Cambiar contraseña (requiere auth)
- `PUT /change-email` - Cambiar email (requiere auth)
- `PUT /avatar` - Actualizar URL de avatar (requiere auth)
- `POST /avatar/upload` - Subir imagen de avatar (requiere auth)

### Products (`/api/products`)
- `GET /` - Listar productos activos (filtro por categoría opcional)
- `GET /categories` - Listar todas las categorías
- `GET /:id` - Detalle de producto con imágenes y categorías

### Cart (`/api/cart`) — requiere auth
- `GET /` - Ver carrito del usuario
- `POST /` - Agregar producto al carrito
- `PUT /:itemId` - Actualizar cantidad
- `DELETE /:itemId` - Eliminar item
- `DELETE /` - Vaciar carrito completo

### Checkout (`/api/checkout`)
- `POST /create-session` - Crear sesión Stripe (requiere auth)
- `POST /webhook` - Webhook de Stripe (sin auth)
- `GET /verify` - Verificar sesión de pago (requiere auth)

### Orders (`/api/orders`) — requiere auth
- `GET /` - Historial de pedidos
- `GET /:id` - Detalle de orden específica

### Admin (`/api/admin`) — requiere auth + rol admin
- `GET /products` - Listar todos los productos (incluyendo inactivos)
- `POST /products` - Crear producto
- `PUT /products/:id` - Actualizar producto
- `DELETE /products/:id` - Soft-delete producto (marca inactivo)
- `POST /products/:id/images` - Agregar imagen a producto
- `DELETE /images/:imageId` - Eliminar imagen
- `GET /categories` - Listar categorías
- `POST /categories` - Crear categoría
- `PUT /categories/:id` - Actualizar categoría
- `DELETE /categories/:id` - Eliminar categoría
- `GET /stock` - Dashboard de inventario y analytics de ventas
- `POST /upload` - Subir imagen (devuelve URL)

### Health
- `GET /api/health` - Health check

## Base de Datos (PostgreSQL)

### Tablas
- **users**: id, email, password_hash, name, role (default 'customer'), email_verified, verification_token, refresh_token, avatar_url, created_at, updated_at
- **products**: id, name, description, price_cents, image_url, category, stock, active (soft-delete), created_at
- **categories**: id, name (unique)
- **product_categories**: product_id, category_id (tabla pivote, PK compuesta)
- **product_images**: id, product_id, image_url, sort_order
- **cart_items**: id, user_id, product_id, quantity — UNIQUE(user_id, product_id)
- **orders**: id, user_id, stripe_session_id (unique), stripe_payment_intent, status (pending/paid/failed), total_cents, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone, processed, created_at
- **order_items**: id, order_id, product_id, product_name, price_cents, quantity
- **pending_verifications**: id, email, token (unique), expires_at, created_at

## Comandos
- `npm run dev` - Inicia server + client concurrentemente
- `npm run dev:server` - Solo servidor Express
- `npm run dev:client` - Solo cliente React
- `npm run seed` - Poblar DB con productos de ejemplo y usuario admin
- `npm run build` (client) - Build de producción

## Flujo Principal
1. Usuario envía email -> recibe verificación -> completa registro (password + nombre) -> login (JWT 15m + refresh 7d)
2. Navega productos por categoría -> agrega al carrito -> ingresa dirección de envío -> checkout
3. Se crea sesión Stripe -> pago -> webhook actualiza orden a "paid" -> reduce stock -> emails de confirmación
4. Usuario ve historial de órdenes y detalle de cada una
5. Admin gestiona productos, categorías, imágenes y monitorea inventario/ventas

## Notas de Desarrollo
- Los precios se manejan en centavos (price_cents) para evitar errores de punto flotante
- El carrito soporta modo guest (localStorage) y sincroniza al hacer login
- El proxy de Vite redirige `/api` y `/uploads` al backend en desarrollo
- Soporte para Cloudflare Tunnel: CORS dinámico, `VITE_BACKEND_URL`, resolución de URLs de imágenes
- Rate limit en auth: 10 requests por 15 minutos
- Passwords hasheados con bcrypt (12 salt rounds)
- Soft-delete en productos (campo `active`) en lugar de borrado real
- Procesamiento de órdenes idempotente (campo `processed` previene duplicados)
- Upload de imágenes con validación de extensión, MIME type y tamaño (2-5 MB)
- Dark mode persistido en localStorage via ThemeContext
- Registro en 2 pasos: verificación de email con tabla `pending_verifications` separada
