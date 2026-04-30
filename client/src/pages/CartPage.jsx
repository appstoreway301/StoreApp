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
      if (errorData?.carrierError) {
        setSelectedQuote(null);
      }
      setCheckoutLoading(false);
    }
  }

  // ==================== CARRITO VACÍO ====================
  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-content">
          <div className="cart-empty-svg">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4H5L6.8 12.5C7 13.3 7.7 13.8 8.5 13.8H17C17.8 13.8 18.5 13.3 18.7 12.5L20 7H6" 
                    stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 7H20" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="19" r="1.8" fill="var(--accent)"/>
              <circle cx="17" cy="19" r="1.8" fill="var(--accent)"/>
            </svg>
          </div>
          <h1>TU CARRITO ESTÁ VACÍO</h1>
          <p className="cart-empty-message">
            No dejes que tu actitud se quede sin outfit.<br />
            Descubre nuestra colección y encuentra tu estilo.
          </p>
          <button 
            className="btn btn-primary cart-empty-btn"
            onClick={() => navigate('/#products')}
          >
            EXPLORAR PRODUCTOS →
          </button>
        </div>
      </div>
    );
  }

  const grandTotal = cartTotal + (selectedQuote?.priceCents || 0);

  return (
    <div className="cart-page">
      <h1 className="cart-page-title">TU CARRITO</h1>
      
      {error && <div className="alert alert-error">{error}</div>}

      {/* Cabecera del carrito (solo desktop) */}
      <div className="cart-header">
        <span>Producto</span>
        <span>Precio</span>
        <span>Cantidad</span>
        <span>Subtotal</span>
        <span></span>
      </div>

      <div className="cart-items">
        {items.map(item => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="cart-summary">
        {/* Frase motivacional */}
        <div className="cart-motivation">
          <p>💪 Cada prenda es una extensión de tu actitud. Completa tu compra.</p>
        </div>

        <div className="cart-summary-inner">
          <div className="cart-summary-row">
            <span>Subtotal:</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          {selectedQuote && (
            <div className="cart-summary-row">
              <span>Envío ({selectedQuote.carrier}):</span>
              <span>{formatPrice(selectedQuote.priceCents)}</span>
            </div>
          )}

          {!showShipping && !selectedQuote && (
            <div className="cart-summary-row cart-summary-shipping">
              <span>Envío:</span>
              <span>Calculado después</span>
            </div>
          )}

          <div className="cart-summary-total">
            <span>Total:</span>
            <strong>{formatPrice(selectedQuote ? grandTotal : cartTotal)}</strong>
          </div>

          {/* Step 1: Proceed to checkout */}
          {!showShipping ? (
            <div className="cart-actions">
              <button className="btn btn-outline" onClick={clearCart}>
                Vaciar carrito
              </button>
              <button className="btn btn-primary" onClick={handleProceed}>
                Proceder al pago →
              </button>
            </div>
          ) : !showQuotes ? (
            /* Step 2: Shipping address form */
            <form onSubmit={handleGetQuotes} className="shipping-form">
              <h3>Dirección de envío</h3>
              <div className="shipping-grid">
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input name="name" value={shipping.name} onChange={handleShippingChange} required />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input name="phone" value={shipping.phone} onChange={handleShippingChange} type="tel" />
                </div>
                <div className="form-group">
                  <label>País *</label>
                  <select name="country" value={shipping.country} onChange={handleShippingChange} required>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Código postal * {zipLoading && '(buscando...)'}</label>
                  <input
                    name="zip"
                    value={shipping.zip}
                    onChange={handleZipChange}
                    onBlur={handleZipBlur}
                    required
                    placeholder="Ingresa tu código postal"
                  />
                </div>
                <div className="form-group">
                  <label>Estado / Provincia *</label>
                  <input name="state" value={shipping.state} onChange={handleShippingChange} required />
                </div>
                <div className="form-group">
                  <label>Ciudad *</label>
                  <input name="city" value={shipping.city} onChange={handleShippingChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Dirección *</label>
                  <input name="address" value={shipping.address} onChange={handleShippingChange} required placeholder="Calle, número, colonia..." />
                </div>
              </div>
              <div className="cart-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowShipping(false)}>Atrás</button>
                <button type="submit" className="btn btn-primary">
                  Obtener cotización de envío
                </button>
              </div>
              <div className="alert-warning">
                <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Verifica que tu dirección sea correcta. Los pedidos enviados a una dirección incorrecta no pueden ser reembolsados.</span>
              </div>
            </form>
          ) : (
            /* Step 3: Select shipping method & pay */
            <div className="shipping-form">
              <h3>Envío a</h3>

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
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div>
                  <strong style={{ color: 'var(--text)' }}>{shipping.name}</strong><br />
                  {shipping.address}, {shipping.city}, {shipping.state} {shipping.zip}<br />
                  {COUNTRIES.find(c => c.code === shipping.country)?.name || shipping.country}
                  {shipping.phone && <><br />{shipping.phone}</>}
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                  onClick={handleBackToAddress}
                >
                  Editar
                </button>
              </div>

              <ShippingQuotes
                shipping={shipping}
                selected={selectedQuote}
                onSelect={setSelectedQuote}
              />

              <div className="cart-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={handleBackToAddress}>Atrás</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!selectedQuote || checkoutLoading}
                  onClick={handleCheckout}
                >
                  {checkoutLoading ? 'Redirigiendo...' : `Confirmar y pagar ${selectedQuote ? formatPrice(grandTotal) : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* Mensaje de garantía */}
          <div className="cart-guarantee">
            <span>🔒</span>
            <span>Envíos seguros a todo México. Garantía de devolución.</span>
          </div>
        </div>
      </div>
    </div>
  );
}