# 🛒 StoreApp — Plataforma E-Commerce Full-Stack

Tienda online completa donde los usuarios pueden navegar productos, gestionar su carrito y **completar compras reales con Stripe**. Incluye un panel de administración para gestionar el catálogo, el inventario y las ventas.

Proyecto full-stack desarrollado de extremo a extremo: frontend en **React**, API en **Express + PostgreSQL**, pagos con **Stripe**, autenticación con **JWT** y verificación de correo.

---

## ✨ Características

### Para el cliente
- 🔐 **Registro en 2 pasos** con verificación de correo electrónico
- 🛍️ Catálogo de productos con filtros por categoría
- 🛒 **Carrito** que funciona como invitado (localStorage) y se sincroniza al iniciar sesión
- 💳 **Checkout con Stripe** (pago real con tarjeta)
- 📧 Correos automáticos de confirmación de pedido
- 📦 Historial de pedidos y detalle de cada orden
- 🌙 Modo oscuro

### Para el administrador
- 📋 Gestión de productos, categorías e imágenes
- 📊 Dashboard de inventario y analíticas de ventas
- 🖼️ Subida de imágenes con validación de tipo y tamaño

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 19, Vite 8, React Router 7, Context API, Axios |
| **Backend** | Node.js, Express 4, PostgreSQL |
| **Pagos** | Stripe (checkout sessions + webhooks) |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Validación** | Zod |
| **Correo** | Nodemailer (SMTP) |
| **Uploads** | Multer (validación MIME + límite de tamaño) |
| **Seguridad** | Helmet, CORS, express-rate-limit |

---

## 🚀 Instalación

### Requisitos previos
- **Node.js 20+**
- **PostgreSQL** (una base de datos creada)
- Una cuenta de **Stripe** (modo test sirve) para las claves de API
- Credenciales **SMTP** para el envío de correos (opcional para probar localmente)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/appstoreway301/StoreApp.git
cd StoreApp

# 2. Instalar dependencias (raíz, cliente y servidor)
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 3. Configurar variables de entorno
copy .env.example .env        # En Windows  (cp en Linux/Mac)
# Edita .env con tus datos (ver tabla abajo)

# 4. Poblar la base de datos con productos de ejemplo y un usuario admin
npm run seed
```

### Variables de entorno (`.env`)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Secretos para los tokens de sesión |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe |
| `CLIENT_URL` | URL del frontend (ej. `http://localhost:5173`) |
| `PORT` | Puerto del servidor (default `3001`) |

> ⚠️ El archivo `.env` con tus claves reales **nunca** se sube al repositorio (está en `.gitignore`).

---

## ▶️ Cómo ejecutarlo y probarlo

```bash
# Inicia el servidor (Express) y el cliente (React) a la vez
npm run dev
```

- Frontend → http://localhost:5173
- API → http://localhost:3001

**Para probar un pago:** usa las [tarjetas de prueba de Stripe](https://stripe.com/docs/testing), por ejemplo `4242 4242 4242 4242` con cualquier fecha futura y CVC. No se cobra dinero real en modo test.

El comando `npm run seed` crea un usuario administrador para que puedas entrar directo al panel de admin.

---

## 🏗️ Cómo funciona (flujo principal)

```
Registro (verifica email) ──► Login (JWT 15m + refresh 7d)
        │
        ▼
Navega productos ──► Agrega al carrito ──► Ingresa dirección de envío
        │
        ▼
Crea sesión de Stripe ──► Paga con tarjeta ──► Webhook de Stripe
        │                                            │
        │                          actualiza orden a "pagada",
        │                          reduce stock y envía correos
        ▼
Ve su historial de pedidos     Admin gestiona catálogo e inventario
```

### Decisiones de diseño destacadas
- **Precios en centavos** (`price_cents`) para evitar errores de punto flotante con el dinero.
- **Procesamiento idempotente** de órdenes: un campo `processed` evita cobrar/duplicar un pedido si el webhook llega dos veces.
- **Soft-delete** de productos (campo `active`) en lugar de borrado real, para preservar el historial.
- **Refresh de token automático** en el cliente Axios mediante interceptores.
- **Carrito híbrido** invitado/usuario que se fusiona al iniciar sesión.

---

## 📁 Estructura del proyecto

```
StoreApp/
├── client/          # SPA en React (Vite)
│   └── src/
│       ├── api/        # Cliente Axios con JWT y refresh automático
│       ├── context/    # Auth, Cart y Theme (dark mode)
│       ├── components/ # Layout, rutas protegidas, ProductCard, etc.
│       └── pages/      # Home, Producto, Carrito, Checkout, Perfil, Admin...
└── server/          # API en Express
    └── src/
        ├── db/         # Conexión, migraciones y seed de PostgreSQL
        ├── models/     # user, product, order, cart, category...
        ├── controllers/# auth, products, cart, checkout, orders, admin
        ├── routes/     # Endpoints de la API REST
        ├── middleware/ # JWT, rol admin, validación Zod, manejo de errores
        └── utils/      # jwt, stripe, email
```

---

*Hecho por [Sergio Bland](https://github.com/appstoreway301)*
