import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import api from '../api/client';
import { useState } from 'react';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  async function handleCheckout() {
    if (!isAuthenticated) {
      navigate('/login?redirect=/cart');
      return;
    }

    setCheckoutLoading(true);
    setError('');

    try {
      const { data } = await api.post('/checkout/create-session');
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start checkout');
      setCheckoutLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <h1>Your Cart</h1>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Your Cart</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="cart-items">
        {items.map(item => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          <span>Total:</span>
          <strong>{formatPrice(cartTotal)}</strong>
        </div>
        <div className="cart-actions">
          <button className="btn" onClick={clearCart}>Clear Cart</button>
          <button
            className="btn btn-primary"
            onClick={handleCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? 'Redirecting...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
