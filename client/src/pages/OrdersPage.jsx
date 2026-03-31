import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
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

  if (loading) return <p>Loading orders...</p>;

  return (
    <div>
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <p>No orders yet. <Link to="/">Start shopping</Link></p>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header" onClick={() => toggleOrder(order.id)}>
                <span>Order #{order.id}</span>
                <span className={`order-status status-${order.status}`}>{order.status}</span>
                <span>{formatPrice(order.total_cents)}</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                <span>{expandedId === order.id ? '▲' : '▼'}</span>
              </div>

              {expandedId === order.id && orderDetails[order.id] && (
                <div className="order-details">
                  <ul className="order-items-list">
                    {orderDetails[order.id].items.map(item => (
                      <li key={item.id}>
                        {item.product_name} x{item.quantity} — {formatPrice(item.price_cents * item.quantity)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
