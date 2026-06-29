import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Package, BarChart3, MapPin, Truck,
  ShoppingBag, TrendingUp, AlertCircle, Activity,
} from "lucide-react";
import api from "../../api/client";

/* ─────────────────────────────────────────────
   Keyframe animations (injected once on mount)
───────────────────────────────────────────── */
const CSS = `
  @keyframes km-fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes km-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes km-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes km-pulse-dot {
    0%, 100% { transform: scale(1);   opacity: 1;   }
    50%       { transform: scale(1.6); opacity: 0.4; }
  }
  @keyframes km-glow-breathe {
    0%, 100% { opacity: 0.12; }
    50%       { opacity: 0.28; }
  }
  @keyframes km-slide-right {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0);    }
  }

  .km-hero     { animation: km-fadeIn  0.8s ease both; }
  .km-stat     { animation: km-fadeUp  0.55s cubic-bezier(.22,.68,0,1.2) both; }
  .km-card     { animation: km-fadeUp  0.6s  cubic-bezier(.22,.68,0,1.2) both; }
  .km-panel    { animation: km-fadeUp  0.65s cubic-bezier(.22,.68,0,1.2) both; }
  .km-row      { animation: km-slide-right 0.4s ease both; }
  .km-glow-bg  { animation: km-glow-breathe 3.5s ease-in-out infinite; }
  .km-dot      { animation: km-pulse-dot 2s ease-in-out infinite; }

  .km-skeleton {
    background: linear-gradient(90deg, #1b1b1b 25%, #252525 50%, #1b1b1b 75%);
    background-size: 200% 100%;
    animation: km-shimmer 1.5s infinite;
    border-radius: 5px;
  }

  .km-stat:hover  { transform: translateY(-3px) !important; }
  .km-card:hover  { transform: translateY(-4px) !important; }
  .km-arrow       { transition: transform 0.2s ease; display: inline-block; }
  .km-card:hover  .km-arrow { transform: translateX(5px); }
  .km-link:hover  .km-arrow { transform: translateX(4px); }

  @media (prefers-reduced-motion: reduce) {
    .km-hero, .km-stat, .km-card, .km-panel, .km-row,
    .km-glow-bg, .km-dot, .km-skeleton {
      animation: none !important;
    }
  }
`;

/* ─────────────────────────────────────────────
   Animated number counter
───────────────────────────────────────────── */
function AnimatedNumber({ value, prefix = "", decimals = 0 }) {
  const [cur, setCur] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to   = value;
    prev.current = to;
    if (from === to) return;

    const duration = 950;
    let t0 = null;

    const tick = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setCur(from + (to - from) * ease);
      if (p < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  const display = decimals > 0
    ? cur.toFixed(decimals)
    : Math.round(cur).toLocaleString("es-MX");

  return <>{prefix}{display}</>;
}

/* ─────────────────────────────────────────────
   Skeleton block helper
───────────────────────────────────────────── */
const Skel = ({ w = 60, h = 14, r = 5 }) => (
  <div className="km-skeleton" style={{ width: w, height: h, borderRadius: r }} />
);

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0, totalOrders: 0, totalRevenue: 0,
    pendingOrders: 0, lowStock: 0, outOfStock: 0,
  });
  const [recentOrders,     setRecentOrders]     = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [dataReady,  setDataReady]  = useState(false);

  /* inject CSS once */
  useEffect(() => {
    const id = "km-dashboard-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = CSS;
      document.head.appendChild(el);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  /* fetch data */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const stockRes = await api.get("/admin/stock");
        const stockData = stockRes.data;

        const ordersRes = await api.get("/orders");
        const orders = ordersRes.data.orders || [];

        const paidOrders   = orders.filter((o) => o.status === "paid");
        const totalRevenue = paidOrders.reduce((s, o) => s + o.total_cents, 0);

        setStats({
          totalProducts: stockData.products?.length || 0,
          totalOrders:   paidOrders.length,
          totalRevenue,
          pendingOrders: orders.filter((o) => o.status === "pending").length,
          lowStock:      stockData.stats?.lowStock  || 0,
          outOfStock:    stockData.stats?.outOfStock || 0,
        });

        setRecentOrders(orders.slice(0, 5));

        setLowStockProducts(
          (stockData.products || [])
            .filter((p) => p.stock <= 5 && p.active)
            .slice(0, 10)
        );

        setDataReady(true);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* helpers */
  const fmt$ = (cents) => `$${(cents / 100).toFixed(2)}`;
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("es-MX", {
      day: "numeric", month: "short", year: "numeric",
    });

  /* ── Stat card definitions ── */
  const statCards = [
    { icon: Package,      label: "Productos",     value: stats.totalProducts, color: "#e85d04", to: "/admin/products" },
    { icon: ShoppingBag,  label: "Pedidos",        value: stats.totalOrders,   color: "#3b82f6", to: "/admin/orders"   },
    { icon: TrendingUp,   label: "Ingresos",       value: null,                color: "#10b981", to: "/admin/orders", isCurrency: true },
    { icon: Activity,     label: "Pendientes",     value: stats.pendingOrders, color: "#f59e0b", to: "/admin/orders", pulse: true },
    { icon: AlertCircle,  label: "Stock bajo",     value: stats.lowStock,      color: "#f59e0b", to: "/admin/stock"   },
    { icon: AlertCircle,  label: "Agotados",       value: stats.outOfStock,    color: "#ef4444", to: "/admin/stock"   },
  ];

  /* ── Nav card definitions ── */
  const navCards = [
    { icon: Package,  title: "Productos",    description: "Agrega y administra productos, imágenes, stock y categorías.",                    to: "/admin/products" },
    { icon: BarChart3, title: "Stock y Ventas", description: "Consulta niveles de inventario, alertas de stock agotado y resumen de ventas.", to: "/admin/stock"    },
    { icon: MapPin,   title: "Sucursales",   description: "Administra sucursales autorizadas, su dirección física y el stock por sucursal.", to: "/admin/branches" },
    { icon: Truck,    title: "Envíos",       description: "Consulta el estado de envíos, reintenta etiquetas fallidas y gestiona el envío.", to: "/admin/shipments"},
  ];

  /* ─────────────── RENDER ─────────────── */
  return (
    <div className="flex flex-col flex-1 -m-4 md:-m-6 lg:-m-10">

      {/* ── HERO ─────────────────────────────────── */}
      <div className="km-hero relative px-4 md:px-6 lg:px-10 pt-6 lg:pt-10 pb-8 overflow-hidden">

        {/* Ambient orange glow */}
        <div
          className="km-glow-bg pointer-events-none absolute"
          style={{
            left: -120, top: -100,
            width: 700, height: 500,
            background: "radial-gradient(circle, rgba(232,93,4,0.22) 0%, transparent 68%)",
            filter: "blur(50px)",
          }}
        />

        <div className="relative max-w-6xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="km-dot"
              style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#e85d04" }}
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: "#e85d04" }}>
              Panel de administración
            </p>
          </div>

          {/* Headline */}
          <h1 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tight text-white leading-none">
            Bienvenido de vuelta
          </h1>

          <p className="text-sm md:text-base mt-4 max-w-xl" style={{ color: "#4a4a4a" }}>
            Gestiona tu tienda KONG MONTOYA desde aquí. Selecciona un módulo para comenzar.
          </p>

          {/* Orange gradient divider */}
          <div
            style={{
              marginTop: 26, height: 1, maxWidth: 480,
              background: "linear-gradient(90deg, #e85d04 0%, transparent 100%)",
              opacity: 0.35,
            }}
          />
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────── */}
      <div className="px-4 md:px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-6xl">
          {statCards.map((card, i) => (
            <Link
              key={i}
              to={card.to}
              className="km-stat block"
              style={{
                animationDelay: `${i * 55}ms`,
                background: "#0f0f0f",
                border: "1px solid #1e1e1e",
                borderRadius: 10,
                padding: "14px 16px",
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.25s, box-shadow 0.25s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = card.color;
                e.currentTarget.style.boxShadow  = `0 0 22px ${card.color}28`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e1e1e";
                e.currentTarget.style.boxShadow  = "none";
              }}
            >
              {/* top colour strip */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: card.color, opacity: 0.65,
              }} />

              {/* label row */}
              <div className="flex items-center gap-1.5 mb-3">
                <card.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: card.color }} />
                <span className="text-[9px] uppercase tracking-widest font-bold truncate" style={{ color: "#484848" }}>
                  {card.label}
                </span>
                {card.pulse && !loading && card.value > 0 && (
                  <span
                    className="km-dot ml-auto flex-shrink-0"
                    style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: card.color }}
                  />
                )}
              </div>

              {/* value */}
              <div className="text-xl font-black text-white" style={{ lineHeight: 1 }}>
                {loading ? (
                  <Skel w={56} h={22} />
                ) : card.isCurrency ? (
                  <AnimatedNumber value={stats.totalRevenue / 100} prefix="$" decimals={2} />
                ) : (
                  <AnimatedNumber value={card.value} />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── NAV CARDS ────────────────────────────── */}
      <div className="px-4 md:px-6 lg:px-10 py-8 lg:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
          {navCards.map((card, i) => (
            <Link
              key={card.title}
              to={card.to}
              className="km-card flex flex-col"
              style={{
                animationDelay: `${180 + i * 70}ms`,
                background: "#0f0f0f",
                border: "1px solid #1e1e1e",
                borderRadius: 14,
                padding: "24px",
                minHeight: 200,
                textDecoration: "none",
                transition: "border-color 0.25s, box-shadow 0.25s, background 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#e85d04";
                e.currentTarget.style.boxShadow   = "0 0 36px rgba(232,93,4,0.14)";
                e.currentTarget.style.background  = "#131313";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e1e1e";
                e.currentTarget.style.boxShadow   = "none";
                e.currentTarget.style.background  = "#0f0f0f";
              }}
            >
              {/* icon */}
              <div style={{
                width: 44, height: 44,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(232,93,4,0.07)",
                border: "1px solid rgba(232,93,4,0.18)",
                borderRadius: 10,
                marginBottom: 20,
                flexShrink: 0,
              }}>
                <card.icon className="w-5 h-5" style={{ color: "#e85d04" }} />
              </div>

              <h3 className="font-display font-black text-sm uppercase tracking-wider text-white mb-2">
                {card.title}
              </h3>

              <p className="text-xs leading-relaxed flex-1" style={{ color: "#4a4a4a" }}>
                {card.description}
              </p>

              <div className="mt-5 flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#3a3a3a" }}>
                  Gestionar
                </span>
                <span className="km-arrow text-sm" style={{ color: "#e85d04" }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── BOTTOM PANELS ────────────────────────── */}
      <div className="px-4 md:px-6 lg:px-10 pb-8 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl">

          {/* Recent Orders */}
          <div
            className="km-panel"
            style={{
              animationDelay: "360ms",
              background: "#0f0f0f",
              border: "1px solid #1e1e1e",
              borderRadius: 14,
              padding: "20px",
            }}
          >
            {/* header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                Últimos pedidos
              </h3>
              {!loading && recentOrders.length > 0 && (
                <span
                  className="km-dot"
                  style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#10b981" }}
                />
              )}
            </div>

            {/* body */}
            {loading ? (
              <div>
                {[0, 1, 2].map((n) => (
                  <div key={n} className="flex items-center justify-between py-3"
                    style={{ borderBottom: "1px solid #181818" }}>
                    <div>
                      <Skel w={52} h={12} />
                      <div style={{ height: 6 }} />
                      <Skel w={76} h={10} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skel w={46} h={12} />
                      <Skel w={64} h={20} r={10} />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={{ padding: "28px 0", textAlign: "center" }}>
                <p className="text-xs" style={{ color: "#2e2e2e" }}>No hay pedidos recientes</p>
              </div>
            ) : (
              <div>
                {recentOrders.map((order, i) => (
                  <div
                    key={order.id}
                    className="km-row flex items-center justify-between py-2.5"
                    style={{
                      borderBottom: "1px solid #181818",
                      animationDelay: `${440 + i * 55}ms`,
                    }}
                  >
                    <div>
                      <span className="text-sm font-black text-white">#{order.id}</span>
                      <br />
                      <span className="text-[10px]" style={{ color: "#3e3e3e" }}>
                        {fmtDate(order.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{fmt$(order.total_cents)}</span>
                      <span
                        className="text-[9px] font-black uppercase px-2 py-1"
                        style={{
                          borderRadius: 20,
                          letterSpacing: "0.1em",
                          background: order.status === "paid"
                            ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                          color: order.status === "paid" ? "#10b981" : "#f59e0b",
                          border: `1px solid ${order.status === "paid"
                            ? "rgba(16,185,129,0.22)" : "rgba(245,158,11,0.22)"}`,
                        }}
                      >
                        {order.status === "paid" ? "Pagado" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/orders"
              className="km-link"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                marginTop: 16, textDecoration: "none",
                color: "#e85d04", transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Ver todos</span>
              <span className="km-arrow">→</span>
            </Link>
          </div>

          {/* Low Stock */}
          <div
            className="km-panel"
            style={{
              animationDelay: "430ms",
              background: "#0f0f0f",
              border: "1px solid #1e1e1e",
              borderRadius: 14,
              padding: "20px",
            }}
          >
            {/* header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                Stock bajo
              </h3>
              {!loading && lowStockProducts.length > 0 && (
                <span
                  className="km-dot"
                  style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }}
                />
              )}
            </div>

            {/* body */}
            {loading ? (
              <div>
                {[0, 1, 2].map((n) => (
                  <div key={n} className="flex items-center justify-between py-3"
                    style={{ borderBottom: "1px solid #181818" }}>
                    <Skel w={110} h={12} />
                    <Skel w={68} h={20} r={10} />
                  </div>
                ))}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div style={{ padding: "28px 0", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6, color: "#10b981" }}>✓</div>
                <p className="text-xs" style={{ color: "#2e2e2e" }}>
                  Todos los productos con stock suficiente
                </p>
              </div>
            ) : (
              <div>
                {lowStockProducts.map((product, i) => (
                  <div
                    key={product.id}
                    className="km-row flex items-center justify-between py-2.5"
                    style={{
                      borderBottom: "1px solid #181818",
                      animationDelay: `${440 + i * 55}ms`,
                    }}
                  >
                    <span className="text-sm text-white">{product.name}</span>
                    <span
                      className="text-[9px] font-black uppercase px-2 py-1"
                      style={{
                        borderRadius: 20,
                        letterSpacing: "0.1em",
                        background: product.stock === 0
                          ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                        color:      product.stock === 0 ? "#ef4444" : "#f59e0b",
                        border:     `1px solid ${product.stock === 0
                          ? "rgba(239,68,68,0.22)" : "rgba(245,158,11,0.22)"}`,
                      }}
                    >
                      {product.stock === 0 ? "Agotado" : `${product.stock} uds`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/admin/stock"
              className="km-link"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                marginTop: 16, textDecoration: "none",
                color: "#e85d04", transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Ver inventario</span>
              <span className="km-arrow">→</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
