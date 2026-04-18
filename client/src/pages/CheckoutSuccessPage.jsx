import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('No session ID');
      setLoading(false);
      return;
    }

    api.get(`/checkout/verify?sessionId=${sessionId}`)
      .then(({ data }) => {
        setOrder(data.order);
        if (data.order?.status === 'paid') {
          clearCart();
        }
      })
      .catch(err => setError(err.response?.data?.error || 'Could not verify payment'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  if (loading) return <p>Verifying payment...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="checkout-result">
      <h1>Payment Successful!</h1>
      <p>Thank you for your order.</p>

      {order && (
        <div className="order-summary">
          <h3>Order #{order.id}</h3>
          <p>Status: <strong>{order.status}</strong></p>
          <p>Total: <strong>{formatPrice(order.total_cents)}</strong></p>

          {order.shipping_carrier && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Shipping: <strong>{order.shipping_carrier.toUpperCase()}</strong>
              {order.shipping_service && ` - ${order.shipping_service}`}
              {order.shipping_cost_cents > 0 && ` (${formatPrice(order.shipping_cost_cents)})`}
            </p>
          )}

          {order.shipment?.tracking_number && (
            <p style={{ fontSize: '0.88rem' }}>
              Tracking: <code>{order.shipment.tracking_number}</code>
              {order.shipment.track_url && (
                <> — <a href={order.shipment.track_url} target="_blank" rel="noopener noreferrer">Track shipment</a></>
              )}
            </p>
          )}

          {order.items && (
            <ul className="order-items-list">
              {order.items.map(item => (
                <li key={item.id}>
                  {item.product_name} x{item.quantity} — {formatPrice(item.price_cents * item.quantity)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="checkout-links">
        <Link to="/orders" className="btn">View All Orders</Link>
        <Link to="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
}
