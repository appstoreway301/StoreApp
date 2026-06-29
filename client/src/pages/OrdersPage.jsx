// client/src/pages/OrdersPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronDown, ChevronUp, Truck, Calendar, DollarSign, Eye, ArrowRight, ShoppingBag, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import api from '../api/client';
import ShipmentTracker from '../components/ShipmentTracker';
import { resolveImageUrl } from '../utils/imageUrl';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getStatusConfig(status) {
    const statusMap = {
      'paid': { 
        label: 'Pagado', 
        icon: CheckCircle,
        class: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
        dot: 'bg-[#10b981]'
      },
      'pending': { 
        label: 'Pendiente', 
        icon: Clock,
        class: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
        dot: 'bg-[#f59e0b]'
      },
      'cancelled': { 
        label: 'Cancelado', 
        icon: XCircle,
        class: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
        dot: 'bg-[#ef4444]'
      },
      'delivered': { 
        label: 'Entregado', 
        icon: CheckCircle,
        class: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
        dot: 'bg-[#3b82f6]'
      },
      'shipped': { 
        label: 'Enviado', 
        icon: Truck,
        class: 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20',
        dot: 'bg-[#8b5cf6]'
      },
    };
    return statusMap[status?.toLowerCase()] || { 
      label: status?.toUpperCase() || 'Desconocido', 
      icon: Package,
      class: 'bg-[var(--border)] text-[var(--text-secondary)] border-[var(--border)]',
      dot: 'bg-[var(--text-light)]'
    };
  }

  async function toggleOrder(orderId) {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    if (!orderDetails[orderId]) {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrderDetails(prev => ({ ...prev, [orderId]: data.order }));
      } catch {
        // ignore
      }
    }
    setExpandedId(orderId);
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status?.toLowerCase() === filter;
  });

  // Estadísticas
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.status === 'paid').length;
  const totalSpent = orders
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + o.total_cents, 0);

  if (loading) {
    return (
      <div className="pt-20 pb-20 min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--text-light)] text-sm font-medium">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        {/* ===== HEADER ===== */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-[var(--accent)] rounded-full" />
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--text)]">
              Mis Pedidos
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm pl-4">
            Historial completo de tus compras en KONG MONTOYA
          </p>
        </div>

        {/* ===== ESTADÍSTICAS PREMIUM ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="group bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)] hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-3xl font-black text-[var(--text)]">{totalOrders}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                  Total Pedidos
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)]/20 transition-colors">
                <ShoppingBag size={22} className="text-[var(--accent)]" />
              </div>
            </div>
          </div>

          <div className="group bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)] hover:border-[#10b981] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-3xl font-black text-[#10b981]">{paidOrders}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                  Completados
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center group-hover:bg-[#10b981]/20 transition-colors">
                <CheckCircle size={22} className="text-[#10b981]" />
              </div>
            </div>
          </div>

          <div className="group bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)] hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-3xl font-black text-[var(--accent)]">{formatPrice(totalSpent)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                  Total Gastado
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)]/20 transition-colors">
                <TrendingUp size={22} className="text-[var(--accent)]" />
              </div>
            </div>
          </div>
        </div>

        {/* ===== FILTROS ===== */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['all', 'paid', 'pending', 'cancelled'].map((status) => {
            const labels = {
              all: 'Todos',
              paid: 'Pagados',
              pending: 'Pendientes',
              cancelled: 'Cancelados'
            };
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full border transition-all duration-300 ${
                  isActive
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-[0_4px_12px_rgba(232,93,4,0.3)]'
                    : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)] hover:-translate-y-0.5'
                }`}
              >
                {labels[status]}
                {isActive && (
                  <span className="ml-2 inline-block w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* ===== LISTA DE PEDIDOS ===== */}
        {filteredOrders.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-16 text-center shadow-[var(--shadow-sm)]">
            <div className="flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[var(--bg)] flex items-center justify-center">
                <Package size={36} className="text-[var(--text-light)]" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text)]">
                  {filter !== 'all' ? `Sin pedidos ${filter === 'paid' ? 'pagados' : filter === 'pending' ? 'pendientes' : 'cancelados'}` : 'Sin pedidos aún'}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm mt-1 max-w-md mx-auto">
                  {filter !== 'all' 
                    ? 'Cambia el filtro para ver otros pedidos.'
                    : 'La colección KONG MONTOYA te espera. Es hora de hacer tu primera compra.'}
                </p>
              </div>
              <Link 
                to="/products" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(232,93,4,0.3)]"
              >
                Explorar Colección
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedId === order.id;
              const details = orderDetails[order.id];

              return (
                <div 
                  key={order.id}
                  className="group bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-md)]"
                >
                  {/* ===== HEADER DEL PEDIDO ===== */}
                  <button
                    onClick={() => toggleOrder(order.id)}
                    className="w-full px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg)]/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      {/* Orden número */}
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:border-[var(--accent)] transition-colors">
                          <Package size={18} className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-base font-black text-[var(--text)]">
                              #{order.id}
                            </span>
                            <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusConfig.class}`}>
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-0.5 text-xs text-[var(--text-light)]">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} />
                              {formatDate(order.created_at)}
                            </span>
                            <span className="text-sm font-bold text-[var(--text)]">
                              {formatPrice(order.total_cents)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-auto sm:ml-0">
                      <span className="text-xs font-medium text-[var(--text-light)] group-hover:text-[var(--accent)] transition-colors">
                        {isExpanded ? 'Ocultar' : 'Ver detalles'}
                      </span>
                      <div className={`w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center transition-all duration-300 ${isExpanded ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'group-hover:border-[var(--accent)]'}`}>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-[var(--accent)]" />
                        ) : (
                          <ChevronDown size={16} className="text-[var(--text-light)] group-hover:text-[var(--accent)] transition-colors" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* ===== DETALLES EXPANDIDOS ===== */}
                  {isExpanded && details && (
                    <div className="border-t border-[var(--border)] px-6 py-6 bg-[var(--bg)]/30">
                      {/* Productos */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-4 bg-[var(--accent)] rounded-full" />
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                            Productos
                          </h4>
                        </div>
                        {details.items?.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center gap-4 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-[var(--border-hover)] transition-colors"
                          >
                            {item.image_url ? (
                              <img 
                                src={resolveImageUrl(item.image_url)} 
                                alt={item.product_name} 
                                className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-[var(--bg)]"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-[var(--bg)] rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package size={20} className="text-[var(--text-light)]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--text)] truncate">
                                {item.product_name}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {formatPrice(item.price_cents)} × {item.quantity}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-[var(--text)]">
                              {formatPrice(item.price_cents * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Resumen del pedido - Grid premium */}
                      <div className="mt-5 pt-5 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-3 bg-[var(--accent)] rounded-full" />
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                              Dirección de Envío
                            </h4>
                          </div>
                          <div className="text-sm text-[var(--text-secondary)] leading-relaxed pl-3 border-l-2 border-[var(--border)]">
                            <strong className="text-[var(--text)]">{details.shipping_name}</strong>
                            <br />
                            {details.shipping_address}
                            <br />
                            {details.shipping_city}, {details.shipping_state} {details.shipping_zip}
                            <br />
                            {details.shipping_country}
                            {details.shipping_phone && <><br />{details.shipping_phone}</>}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-3 bg-[var(--accent)] rounded-full" />
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                              Resumen
                            </h4>
                          </div>
                          <div className="space-y-1.5 text-sm pl-3">
                            <div className="flex justify-between">
                              <span className="text-[var(--text-secondary)]">Subtotal</span>
                              <span className="text-[var(--text)]">{formatPrice(details.total_cents - (details.shipping_cost_cents || 0))}</span>
                            </div>
                            {details.shipping_cost_cents > 0 && (
                              <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">Envío ({details.shipping_carrier?.toUpperCase()})</span>
                                <span className="text-[var(--text)]">{formatPrice(details.shipping_cost_cents)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-2 mt-1 border-t-2 border-[var(--border)] font-bold">
                              <span className="text-[var(--text)]">Total</span>
                              <span className="text-[var(--accent)] text-lg">{formatPrice(details.total_cents)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tracking */}
                      {order.status === 'paid' && (
                        <div className="mt-5 pt-5 border-t border-[var(--border)]">
                          <ShipmentTracker orderId={order.id} />
                        </div>
                      )}

                      {/* Botón de acción */}
                      <div className="mt-5 pt-5 border-t border-[var(--border)] flex flex-wrap gap-3">
                        <Link 
                          to="/products"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(232,93,4,0.3)]"
                        >
                          <ShoppingBag size={14} />
                          Volver a Comprar
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}