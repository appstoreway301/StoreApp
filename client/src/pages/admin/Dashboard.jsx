import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, BarChart3, MapPin, Truck, ShoppingBag, DollarSign, AlertCircle, TrendingUp } from "lucide-react";
import api from "../../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener stock y ventas
        const stockRes = await api.get('/admin/stock');
        const stockData = stockRes.data;
        
        // Obtener pedidos recientes
        const ordersRes = await api.get('/orders');
        const orders = ordersRes.data.orders || [];
        
        // Calcular estadísticas
        const paidOrders = orders.filter(o => o.status === 'paid');
        const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_cents, 0);
        
        setStats({
          totalProducts: stockData.products?.length || 0,
          totalOrders: paidOrders.length,
          totalRevenue: totalRevenue,
          pendingOrders: orders.filter(o => o.status === 'pending').length,
          lowStock: stockData.stats?.lowStock || 0,
          outOfStock: stockData.stats?.outOfStock || 0,
        });
        
        // Últimos 5 pedidos
        setRecentOrders(orders.slice(0, 5));
        
        // Productos con stock bajo
        const lowStockItems = (stockData.products || [])
          .filter(p => p.stock <= 5 && p.active)
          .slice(0, 10);
        setLowStockProducts(lowStockItems);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const statCards = [
    {
      icon: Package,
      label: "Productos",
      value: stats.totalProducts,
      color: "#e85d04",
      to: "/admin/products",
    },
    {
      icon: ShoppingBag,
      label: "Pedidos totales",
      value: stats.totalOrders,
      color: "#3b82f6",
      to: "/admin/orders",
    },
    {
      icon: DollarSign,
      label: "Ingresos totales",
      value: formatPrice(stats.totalRevenue),
      color: "#10b981",
      to: "/admin/orders",
    },
    {
      icon: AlertCircle,
      label: "Pendientes",
      value: stats.pendingOrders,
      color: "#f59e0b",
      to: "/admin/orders",
    },
    {
      icon: AlertCircle,
      label: "Stock bajo",
      value: stats.lowStock,
      color: "#f59e0b",
      to: "/admin/stock",
    },
    {
      icon: AlertCircle,
      label: "Agotados",
      value: stats.outOfStock,
      color: "#ef4444",
      to: "/admin/stock",
    },
  ];

  const cards = [
    {
      icon: Package,
      title: "Productos",
      description: "Agrega y administra productos, imágenes, stock y categorías.",
      to: "/admin/products",
    },
    {
      icon: BarChart3,
      title: "Stock y Ventas",
      description: "Consulta niveles de inventario, alertas de stock agotado y resumen de ventas.",
      to: "/admin/stock",
    },
    {
      icon: MapPin,
      title: "Sucursales",
      description: "Administra sucursales autorizadas, su dirección física y el stock por sucursal.",
      to: "/admin/branches",
    },
    {
      icon: Truck,
      title: "Envíos",
      description: "Consulta el estado de envíos, reintenta etiquetas fallidas y gestiona el envío.",
      to: "/admin/shipments",
    },
  ];

  return (
    <div className="flex flex-col flex-1 -m-4 md:-m-6 lg:-m-10">
      {/* Hero / intro */}
      <div className="px-4 md:px-6 lg:px-10 pt-6 lg:pt-10 pb-6">
        <div className="max-w-6xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "#e85d04" }}>
            Panel de administración
          </p>
          <h1 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tight text-white leading-none">
            Bienvenido de vuelta
          </h1>
          <p className="text-sm md:text-base mt-4 max-w-xl" style={{ color: "#666" }}>
            Gestiona tu tienda KONG MONTOYA desde aquí. Selecciona un módulo para comenzar.
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="px-4 md:px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-6xl">
          {statCards.map((card, index) => (
            <Link
              key={index}
              to={card.to}
              className="block p-4 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#171717",
                border: "1px solid #222",
                borderRadius: "8px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = card.color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}
            >
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "#777" }}>
                  {card.label}
                </span>
              </div>
              <div className="text-xl font-bold text-white">
                {card.value}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="px-4 md:px-6 lg:px-10 py-8 lg:py-12 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="group relative flex flex-col p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#171717",
                border: "1px solid #222",
                borderRadius: "12px",
                minHeight: 200,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#e85d04")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}
            >
              <div
                className="w-11 h-11 flex items-center justify-center mb-5 transition-colors"
                style={{
                  background: "rgba(232,93,4,0.1)",
                  border: "1px solid rgba(232,93,4,0.25)",
                  borderRadius: "8px",
                }}
              >
                <card.icon className="w-5 h-5" style={{ color: "#e85d04" }} />
              </div>

              <h3 className="font-display font-black text-base uppercase tracking-wide text-white mb-2">
                {card.title}
              </h3>

              <p className="text-xs leading-relaxed flex-1" style={{ color: "#777" }}>
                {card.description}
              </p>

              <div className="mt-4 flex items-center gap-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest transition-colors"
                  style={{ color: "#555" }}
                >
                  Gestionar
                </span>
                <span
                  className="transition-transform group-hover:translate-x-1"
                  style={{ color: "#e85d04" }}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders and low stock */}
      <div className="px-4 md:px-6 lg:px-10 pb-8 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
          {/* Recent Orders */}
          <div
            className="p-5"
            style={{
              background: "#171717",
              border: "1px solid #222",
              borderRadius: "12px",
            }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-4">
              Últimos pedidos
            </h3>
            {loading ? (
              <p className="text-sm" style={{ color: "#555" }}>Cargando...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm" style={{ color: "#555" }}>No hay pedidos recientes</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between pb-2"
                    style={{ borderBottom: "1px solid #222" }}
                  >
                    <div>
                      <span className="text-sm font-medium text-white">#{order.id}</span>
                      <span className="text-xs ml-2" style={{ color: "#555" }}>
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white">
                        {formatPrice(order.total_cents)}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                        style={{
                          background: order.status === 'paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                          color: order.status === 'paid' ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {order.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              to="/orders"
              className="text-xs font-bold uppercase tracking-wider mt-4 inline-block transition-colors"
              style={{ color: "#e85d04" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#d45003")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#e85d04")}
            >
              Ver todos →
            </Link>
          </div>

          {/* Low Stock Products */}
          <div
            className="p-5"
            style={{
              background: "#171717",
              border: "1px solid #222",
              borderRadius: "12px",
            }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-4">
              Stock bajo
            </h3>
            {loading ? (
              <p className="text-sm" style={{ color: "#555" }}>Cargando...</p>
            ) : lowStockProducts.length === 0 ? (
              <p className="text-sm" style={{ color: "#555" }}>Todos los productos tienen stock suficiente</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between pb-2"
                    style={{ borderBottom: "1px solid #222" }}
                  >
                    <span className="text-sm text-white">{product.name}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        background: product.stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: product.stock === 0 ? '#ef4444' : '#f59e0b',
                      }}
                    >
                      {product.stock === 0 ? 'Agotado' : `${product.stock} unidades`}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link
              to="/admin/stock"
              className="text-xs font-bold uppercase tracking-wider mt-4 inline-block transition-colors"
              style={{ color: "#e85d04" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#d45003")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#e85d04")}
            >
              Ver inventario →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}