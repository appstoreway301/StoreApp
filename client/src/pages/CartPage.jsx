import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import api from '../api/client';
import { useState } from 'react';

const emptyShipping = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'MX',
  phone: '',
};

const COUNTRIES = [
  { code: 'MX', name: 'Mexico' },
  { code: 'US', name: 'United States' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ES', name: 'Spain' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
];

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShipping, setShowShipping] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [shipping, setShipping] = useState(() => {
    const saved = localStorage.getItem('shipping');
    return saved ? JSON.parse(saved) : emptyShipping;
  });

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function updateShipping(updates) {
    const updated = { ...shipping, ...updates };
    setShipping(updated);
    localStorage.setItem('shipping', JSON.stringify(updated));
  }

  function handleShippingChange(e) {
    updateShipping({ [e.target.name]: e.target.value });
  }

  async function lookupZip(zip) {
    if (!zip || zip.length < 3) return;
    const country = shipping.country || 'MX';
    setZipLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/${country.toLowerCase()}/${zip}`);
      if (res.ok) {
        const data = await res.json();
        const place = data.places?.[0];
        if (place) {
          updateShipping({
            zip,
            city: place['place name'] || '',
            state: place['state'] || '',
            country: country,
          });
        }
      }
    } catch {
      // silently fail, user can fill manually
    } finally {
      setZipLoading(false);
    }
  }

  function handleZipChange(e) {
    const zip = e.target.value;
    updateShipping({ zip });
  }

  function handleZipBlur() {
    lookupZip(shipping.zip);
  }

  function handleProceed() {
    if (!isAuthenticated) {
      navigate('/login?redirect=/cart');
      return;
    }
    setShowShipping(true);
    setError('');
  }

  async function handleCheckout(e) {
    e.preventDefault();
    setError('');

    const countryName = COUNTRIES.find(c => c.code === shipping.country)?.name || shipping.country;

    if (!shipping.name || !shipping.address || !shipping.city || !shipping.state || !shipping.zip || !shipping.country) {
      setError('Please fill in all required address fields');
      return;
    }

    setCheckoutLoading(true);

    try {
      const { data } = await api.post('/checkout/create-session', {
        shipping: { ...shipping, country: countryName },
      });
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

        {!showShipping ? (
          <div className="cart-actions">
            <button className="btn" onClick={clearCart}>Clear Cart</button>
            <button className="btn btn-primary" onClick={handleProceed}>
              Proceed to Checkout
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="shipping-form">
            <h3>Shipping Address</h3>
            <div className="shipping-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" value={shipping.name} onChange={handleShippingChange} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={shipping.phone} onChange={handleShippingChange} type="tel" />
              </div>
              <div className="form-group">
                <label>Country *</label>
                <select name="country" value={shipping.country} onChange={handleShippingChange} required>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ZIP / Postal Code * {zipLoading && '(searching...)'}</label>
                <input
                  name="zip"
                  value={shipping.zip}
                  onChange={handleZipChange}
                  onBlur={handleZipBlur}
                  required
                  placeholder="Enter ZIP to auto-fill"
                />
              </div>
              <div className="form-group">
                <label>State / Province *</label>
                <input name="state" value={shipping.state} onChange={handleShippingChange} required />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input name="city" value={shipping.city} onChange={handleShippingChange} required />
              </div>
              <div className="form-group full-width">
                <label>Address *</label>
                <input name="address" value={shipping.address} onChange={handleShippingChange} required placeholder="Street, number, apartment..." />
              </div>
            </div>
            <div className="cart-actions">
              <button type="button" className="btn" onClick={() => setShowShipping(false)}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={checkoutLoading}>
                {checkoutLoading ? 'Redirecting...' : 'Confirm & Pay'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
