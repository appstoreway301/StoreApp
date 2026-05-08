import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  function getStatusBadge(status) {
    const statusMap = {
      'paid': { label: 'PAGADO', class: 'status-paid' },
      'pending': { label: 'PENDIENTE', class: 'status-pending' },
      'cancelled': { label: 'CANCELADO', class: 'status-cancelled' },
      'delivered': { label: 'ENTREGADO', class: 'status-delivered' },
      'shipped': { label: 'ENVIADO', class: 'status-shipped' }
    };
    const s = statusMap[status?.toLowerCase()] || { label: status?.toUpperCase() || 'DESCONOCIDO', class: 'status-unknown' };
    return <span className={`order-status-badge ${s.class}`}>{s.label}</span>;
  }

  async function toggleOrder(orderId) {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    if (!orderDetails[orderId]) {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrderDetails(prev => ({ ...prev, [orderId]: data.order }));
    }
    setExpandedId(orderId);
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status?.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1 className="orders-page-title">MIS PEDIDOS</h1>

      {/* Filtros */}
      <div className="orders-filters">
        <button 
          className={`orders-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button 
          className={`orders-filter-btn ${filter === 'paid' ? 'active' : ''}`}
          onClick={() => setFilter('paid')}
        >
          Pagados
        </button>
        <button 
          className={`orders-filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pendientes
        </button>
        <button 
          className={`orders-filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelados
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-content">
            <div className="cart-empty-svg">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" 
                      stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" stroke="var(--accent)" strokeWidth="1.5"/>
              </svg>
            </div>
            <h1>NO HAY PEDIDOS</h1>
            <p className="cart-empty-message">
              {filter !== 'all' 
                ? `No tienes pedidos ${filter === 'paid' ? 'pagados' : filter === 'pending' ? 'pendientes' : 'cancelados'}.`
                : 'Aún no has realizado ninguna compra.'}
            </p>
            <Link to="/#products" className="btn btn-primary cart-empty-btn">
              EXPLORAR PRODUCTOS →
            </Link>
          </div>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              {/* Cabecera del pedido (clickeable) */}
              <div className="order-card-header" onClick={() => toggleOrder(order.id)}>
                <div className="order-card-info">
                  <div className="order-card-id">
                    <span className="order-label">Orden</span>
                    <strong>#{order.id}</strong>
                  </div>
                  <div className="order-card-date">
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <div className="order-card-right">
                  {getStatusBadge(order.status)}
                  <span className="order-card-total">{formatPrice(order.total_cents)}</span>
                  <span className="order-card-expand">{expandedId === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Detalles expandidos */}
              {expandedId === order.id && orderDetails[order.id] && (
                <div className="order-details-expanded">
                  {/* Productos */}
                  <div className="cart-header orders-header">
                    <span>Producto</span>
                    <span>Precio</span>
                    <span>Cantidad</span>
                    <span>Subtotal</span>
                    <span></span>
                  </div>

                  <div className="order-items">
                    {orderDetails[order.id].items.map(item => (
                      <div key={item.id} className="cart-item order-item">
                        {/* Imagen */}
                        {item.image_url ? (
                          <img 
                            src={resolveImageUrl(item.image_url)} 
                            alt={item.product_name} 
                            className="cart-item-img"
                          />
                        ) : (
                          <div className="cart-item-img-placeholder">🛍️</div>
                        )}
                        
                        {/* Información */}
                        <div className="cart-item-info">
                          <h4>{item.product_name}</h4>
                          <p className="cart-item-price">{formatPrice(item.price_cents)}</p>
                        </div>

                        {/* Cantidad */}
                        <div className="cart-item-actions">
                          <span className="cart-item-qty">{item.quantity}</span>
                        </div>

                        {/* Subtotal */}
                        <div className="cart-item-total">
                          {formatPrice(item.price_cents * item.quantity)}
                        </div>

                        <div></div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen de envío */}
                  {(orderDetails[order.id].shipping_carrier || orderDetails[order.id].shipping_cost_cents > 0) && (
                    <div className="order-shipping-info">
                      <strong>Envío:</strong> 
                      {orderDetails[order.id].shipping_carrier && (
                        <span>{orderDetails[order.id].shipping_carrier.toUpperCase()}</span>
                      )}
                      {orderDetails[order.id].shipping_service && (
                        <span> - {orderDetails[order.id].shipping_service}</span>
                      )}
                      {orderDetails[order.id].shipping_cost_cents > 0 && (
                        <span> ({formatPrice(orderDetails[order.id].shipping_cost_cents)})</span>
                      )}
                    </div>
                  )}

                  {/* Shipment Tracker (solo si está pagado) */}
                  {order.status === 'paid' && (
                    <div className="order-shipment-tracker">
                      <ShipmentTracker orderId={order.id} />
                    </div>
                  )}

                  {/* Botón volver a comprar */}
                  <div className="order-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={() => window.location.href = '/#products'}
                    >
                      Volver a comprar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}