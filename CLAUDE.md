# StoreApp - E-Commerce Platform

## Objetivo del Proyecto
StoreApp es una plataforma e-commerce full-stack donde los usuarios pueden navegar productos, gestionar carritos de compra y completar compras con integración de pagos Stripe.

## Tech Stack
- **Frontend**: React 19 + Vite + React Router + Axios + Context API
- **Backend**: Node.js + Express 4 + better-sqlite3 + JWT + Zod
- **Pagos**: Stripe (checkout sessions + webhooks)
- **Email**: Nodemailer (verificación de cuenta)
- **Seguridad**: Helmet, CORS, bcrypt, rate-limit

## Estructura del Proyecto
```
StoreApp/
├── client/          # React SPA (puerto 5173)
│   ├── src/
│   │   ├── api/         # Axios client con interceptores JWT
│   │   ├── context/     # AuthContext, CartContext
│   │   ├── components/  # Layout, Navbar, ProductCard, CartItem, ProtectedRoute
│   │   └── pages/       # Home, Product, Login, Register, Cart, Orders, Checkout
│   └── vite.config.js   # Proxy /api -> localhost:3001
├── server/          # Express API (puerto 3001)
│   ├── src/
│   │   ├── config/      # Variables de entorno
│   │   ├── db/          # Conexion SQLite, migraciones, seed
│   │   ├── models/      # user, product, order, cart
│   │   ├── controllers/ # auth, products, cart, checkout, orders
│   │   ├── routes/      # Definicion de endpoints
│   │   ├── middleware/   # auth (JWT), validate (Zod), errorHandler
│   │   ├── schemas/     # Validaciones Zod
│   │   └── utils/       # jwt, stripe, email
│   └── data/            # SQLite DB (store.db)
└── .env                 # Configuracion (JWT secrets, Stripe keys, SMTP)
```

## API Endpoints
- `POST/GET /api/auth/*` - Registro, login, logout, refresh, verify-email, me
- `GET /api/products` - Listar/filtrar productos | `GET /api/products/:id`
- `GET/POST/PUT/DELETE /api/cart` - CRUD del carrito (requiere auth)
- `POST /api/checkout/create-session` - Crear sesion Stripe
- `POST /api/checkout/webhook` - Webhook de Stripe
- `GET /api/orders` - Historial de pedidos (requiere auth)

## Base de Datos (SQLite)
- **users**: id, email, password_hash, name, email_verified, tokens
- **products**: id, name, description, price_cents, image_url, category, stock
- **cart_items**: id, user_id, product_id, quantity
- **orders**: id, user_id, stripe_session_id, status (pending/paid/failed), total_cents
- **order_items**: id, order_id, product_id, product_name, price_cents, quantity

## Comandos
- `npm run dev` - Inicia server + client concurrentemente
- `npm run seed` - Poblar DB con productos de ejemplo
- `npm run build` (client) - Build de produccion

## Flujo Principal
1. Usuario se registra -> verifica email -> login (JWT 15m + refresh 7d)
2. Navega productos -> agrega al carrito -> checkout
3. Se crea sesion Stripe -> pago -> webhook actualiza orden a "paid"
4. Usuario ve historial de ordenes

## Notas de Desarrollo
- Los precios se manejan en centavos (price_cents) para evitar errores de punto flotante
- El carrito soporta modo guest (localStorage) y sincroniza al hacer login
- El proxy de Vite redirige `/api` al backend en desarrollo
- Rate limit en auth: 10 requests por 15 minutos
- Passwords hasheados con bcrypt (12 salt rounds)
