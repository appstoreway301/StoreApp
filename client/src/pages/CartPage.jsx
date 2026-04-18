import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import ShippingQuotes from '../components/ShippingQuotes';
import api from '../api/client';
import { useState, useEffect } from 'react';

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
  const [showQuotes, setShowQuotes] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [shipping, setShipping] = useState(emptyShipping);

  // Cargar direcciones guardadas del usuario
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/addresses').then(({ data }) => {
        const addrs = data.addresses || [];
        setSavedAddresses(addrs);
        const defaultAddr = addrs.find(a => a.is_default) || addrs[0];
        if (defaultAddr) {
          setShipping({
            name: defaultAddr.name,
            address: defaultAddr.address,
            city: defaultAddr.city,
            state: defaultAddr.state,
            zip: defaultAddr.zip,
            country: defaultAddr.country,
            phone: defaultAddr.phone || '',
          });
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function updateShipping(updates) {
    setShipping(prev => ({ ...prev, ...updates }));
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

  function selectSavedAddress(addr) {
    setShipping({
      name: addr.name,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone || '',
    });
  }

  function handleProceed() {
    if (!isAuthenticated) {
      navigate('/login?redirect=/cart');
      return;
    }
    setShowShipping(true);
    setError('');
    // Si ya tiene direcciones guardadas, saltar directo a quotes
    if (savedAddresses.length > 0) {
      setShowQuotes(true);
    }
  }

  function handleGetQuotes(e) {
    e.preventDefault();
    setError('');

    if (!shipping.name || !shipping.address || !shipping.city || !shipping.state || !shipping.zip || !shipping.country) {
      setError('Please fill in all required address fields');
      return;
    }

    setShowQuotes(true);
    setSelectedQuote(null);
  }

  function handleBackToAddress() {
    setShowQuotes(false);
    setSelectedQuote(null);
  }

  async function handleCheckout() {
    setError('');

    if (!selectedQuote) {
      setError('Please select a shipping method');
      return;
    }

    setCheckoutLoading(true);

    try {
      const { data } = await api.post('/checkout/create-session', {
        shipping: { ...shipping },
        shippingQuote: {
          carrier: selectedQuote.carrier,
          service: selectedQuote.service,
          amountCents: selectedQuote.priceCents,
        },
      });
      window.location.href = data.url;
    } catch (err) {
      const errorData = err.response?.data;
      setError(errorData?.error || 'Could not start checkout');
      // If carrier failed, go back to quote selection so user can pick another
      if (errorData?.carrierError) {
        setSelectedQuote(null);
      }
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

  const grandTotal = cartTotal + (selectedQuote?.priceCents || 0);

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
          <span>Subtotal:</span>
          <strong>{formatPrice(cartTotal)}</strong>
        </div>

        {selectedQuote && (
          <div className="cart-total" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            <span>Shipping ({selectedQuote.carrier}):</span>
            <span>{formatPrice(selectedQuote.priceCents)}</span>
          </div>
        )}

        {selectedQuote && (
          <div className="cart-total" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <span>Total:</span>
            <strong>{formatPrice(grandTotal)}</strong>
          </div>
        )}

        {/* Step 1: Proceed to checkout */}
        {!showShipping ? (
          <div className="cart-actions">
            <button className="btn" onClick={clearCart}>Clear Cart</button>
            <button className="btn btn-primary" onClick={handleProceed}>
              Proceed to Checkout
            </button>
          </div>
        ) : !showQuotes ? (
          /* Step 2: Shipping address form */
          <form onSubmit={handleGetQuotes} className="shipping-form">
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
              <button type="submit" className="btn btn-primary">
                Get Shipping Quotes
              </button>
            </div>
            <div className="alert-warning">
              <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Please verify that your shipping address is correct before proceeding. Orders shipped to an incorrect address cannot be refunded.</span>
            </div>
          </form>
        ) : (
          /* Step 3: Select shipping method & pay */
          <div className="shipping-form">
            <h3>Shipping To</h3>

            {/* Selector de direcciones guardadas */}
            {savedAddresses.length > 1 && (
              <div className="address-selector" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {savedAddresses.map(addr => {
                  const isSelected = shipping.name === addr.name && shipping.address === addr.address && shipping.zip === addr.zip;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      className={`btn btn-sm${isSelected ? ' btn-primary' : ''}`}
                      onClick={() => { selectSavedAddress(addr); setSelectedQuote(null); }}
                    >
                      {addr.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="shipping-address-summary" style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <strong style={{ color: 'var(--text)' }}>{shipping.name}</strong><br />
                {shipping.address}, {shipping.city}, {shipping.state} {shipping.zip}<br />
                {COUNTRIES.find(c => c.code === shipping.country)?.name || shipping.country}
                {shipping.phone && <><br />{shipping.phone}</>}
              </div>
              <button
                type="button"
                className="btn"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                onClick={handleBackToAddress}
              >
                Edit
              </button>
            </div>

            <ShippingQuotes
              shipping={shipping}
              selected={selectedQuote}
              onSelect={setSelectedQuote}
            />

            <div className="cart-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn" onClick={handleBackToAddress}>Back</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedQuote || checkoutLoading}
                onClick={handleCheckout}
              >
                {checkoutLoading ? 'Redirecting...' : `Confirm & Pay ${selectedQuote ? formatPrice(grandTotal) : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
