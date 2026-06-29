// client/src/pages/CartPage.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import ShippingQuotes from '../components/ShippingQuotes';
import api from '../api/client';
import { useState, useEffect } from 'react';
import { 
  ShoppingBag, Trash2, ArrowRight, Shield, Truck, 
  CreditCard, MapPin, ChevronRight, Package, X 
} from 'lucide-react';

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
  { code: 'MX', name: 'México' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ES', name: 'España' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CA', name: 'Canadá' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'DE', name: 'Alemania' },
  { code: 'FR', name: 'Francia' },
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
  const [step, setStep] = useState(1); // 1: Cart, 2: Shipping, 3: Payment

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
      // silently fail
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
    setSelectedQuote(null);
  }

  function handleProceed() {
    if (!isAuthenticated) {
      navigate('/login?redirect=/cart');
      return;
    }
    setStep(2);
    setError('');
    if (savedAddresses.length > 0) {
      setShowQuotes(true);
    }
  }

  function handleGetQuotes(e) {
    e.preventDefault();
    setError('');

    if (!shipping.name || !shipping.address || !shipping.city || !shipping.state || !shipping.zip || !shipping.country) {
      setError('Completa todos los campos de la dirección');
      return;
    }

    setShowQuotes(true);
    setStep(3);
    setSelectedQuote(null);
  }

  function handleBackToAddress() {
    setShowQuotes(false);
    setStep(2);
    setSelectedQuote(null);
  }

  function handleBackToCart() {
    setShowQuotes(false);
    setStep(1);
    setSelectedQuote(null);
    setShowShipping(false);
  }

  async function handleCheckout() {
    setError('');

    if (!selectedQuote) {
      setError('Selecciona un método de envío');
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
      setError(errorData?.error || 'Error al iniciar el pago');
      if (errorData?.carrierError) {
        setSelectedQuote(null);
      }
      setCheckoutLoading(false);
    }
  }

  // ==================== CARRITO VACÍO ====================
  if (items.length === 0) {
    return (
      <div className="pt-20 pb-20 min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center">
              <ShoppingBag size={40} className="text-[var(--text-light)]" />
            </div>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[var(--text)]">
            Tu carrito está vacío
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2 max-w-xs mx-auto">
            No dejes que tu actitud se quede sin outfit. Descubre nuestra colección.
          </p>
          <button 
            className="mt-6 px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(232,93,4,0.3)]"
            onClick={() => navigate('/products')}
          >
            Explorar Productos
            <ArrowRight size={16} className="inline ml-2" />
          </button>
        </div>
      </div>
    );
  }

  const grandTotal = cartTotal + (selectedQuote?.priceCents || 0);

  return (
    <div className="pt-20 pb-20 min-h-screen bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* ===== HEADER ===== */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-[var(--accent)] rounded-full" />
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--text)]">
            Tu Carrito
          </h1>
          <span className="ml-auto text-sm text-[var(--text-light)] bg-[var(--card-bg)] px-4 py-1.5 rounded-full border border-[var(--border)]">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {/* ===== STEPS INDICATOR ===== */}
        <div className="flex items-center gap-2 mb-8 px-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl">
          {[
            { num: 1, label: 'Carrito', icon: ShoppingBag },
            { num: 2, label: 'Envío', icon: MapPin },
            { num: 3, label: 'Pago', icon: CreditCard },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-[var(--accent)]' : 'text-[var(--text-light)]'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s.num 
                    ? 'bg-[var(--accent)] text-white shadow-[0_4px_12px_rgba(232,93,4,0.3)]' 
                    : 'bg-[var(--bg)] text-[var(--text-light)] border border-[var(--border)]'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div className={`flex-1 h-px mx-2 ${step > s.num ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 text-[var(--danger)] border border-red-500/20 rounded-xl p-4 text-sm flex items-center gap-3">
            <X size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== COLUMNA IZQUIERDA - PRODUCTOS ===== */}
          <div className="lg:col-span-2">
            {/* Cabecera de productos (solo desktop) */}
            <div className="hidden md:grid grid-cols-[80px,1fr,120px,100px,40px] gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-light)] border-b border-[var(--border)]">
              <span>Producto</span>
              <span></span>
              <span className="text-center">Cantidad</span>
              <span className="text-right">Subtotal</span>
              <span></span>
            </div>

            <div className="space-y-3 mt-4 md:mt-0">
              {items.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Frase motivacional */}
            <div className="mt-6 p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl">
              <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                <span className="text-xl">💪</span>
                Cada prenda es una extensión de tu actitud. Completa tu compra.
              </p>
            </div>

            {/* Botón volver */}
            <button
              onClick={() => navigate('/products')}
              className="mt-4 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors flex items-center gap-2"
            >
              ← Seguir comprando
            </button>
          </div>

          {/* ===== COLUMNA DERECHA - RESUMEN ===== */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text)] mb-4">
                  Resumen del Pedido
                </h3>

                {/* Productos resumen */}
                <div className="space-y-2 max-h-32 overflow-y-auto mb-4 pr-1">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)] truncate">
                        {item.name} <span className="text-[var(--text-light)]">×{item.quantity}</span>
                      </span>
                      <span className="text-[var(--text)] font-medium">
                        {formatPrice(item.price_cents * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--border)] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Subtotal</span>
                    <span className="text-[var(--text)] font-medium">{formatPrice(cartTotal)}</span>
                  </div>

                  {selectedQuote ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">
                        Envío ({selectedQuote.carrier})
                      </span>
                      <span className="text-[var(--text)] font-medium">
                        {formatPrice(selectedQuote.priceCents)}
                      </span>
                    </div>
                  ) : step === 1 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Envío</span>
                      <span className="text-[var(--text-light)] italic">Calculado después</span>
                    </div>
                  ) : null}
                </div>

                <div className="border-t-2 border-[var(--border)] pt-4 mt-2">
                  <div className="flex justify-between text-lg font-black">
                    <span className="text-[var(--text)]">Total</span>
                    <span className="text-[var(--accent)]">
                      {formatPrice(selectedQuote ? grandTotal : cartTotal)}
                    </span>
                  </div>
                </div>

                {/* ===== STEP 1: CARRITO ===== */}
                {step === 1 && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={clearCart}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] hover:border-[var(--danger)] text-[var(--text-secondary)] hover:text-[var(--danger)] font-semibold text-sm rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                      Vaciar carrito
                    </button>
                    <button
                      onClick={handleProceed}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(232,93,4,0.3)]"
                    >
                      Proceder al pago
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}

                {/* ===== STEP 2: DIRECCIÓN DE ENVÍO ===== */}
                {step === 2 && (
                  <div className="mt-6">
                    <form onSubmit={handleGetQuotes} className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                            Nombre completo *
                          </label>
                          <input
                            name="name"
                            value={shipping.name}
                            onChange={handleShippingChange}
                            required
                            className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                            placeholder="Tu nombre"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                            Teléfono
                          </label>
                          <input
                            name="phone"
                            value={shipping.phone}
                            onChange={handleShippingChange}
                            type="tel"
                            className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                            placeholder="Ej: 662 123 4567"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                              País *
                            </label>
                            <select
                              name="country"
                              value={shipping.country}
                              onChange={handleShippingChange}
                              required
                              className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                            >
                              {COUNTRIES.map(c => (
                                <option key={c.code} value={c.code}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                              Código postal * {zipLoading && '🔍'}
                            </label>
                            <input
                              name="zip"
                              value={shipping.zip}
                              onChange={handleZipChange}
                              onBlur={handleZipBlur}
                              required
                              className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                              placeholder="83000"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                              Estado *
                            </label>
                            <input
                              name="state"
                              value={shipping.state}
                              onChange={handleShippingChange}
                              required
                              className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                              placeholder="Sonora"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                              Ciudad *
                            </label>
                            <input
                              name="city"
                              value={shipping.city}
                              onChange={handleShippingChange}
                              required
                              className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                              placeholder="Hermosillo"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                            Dirección *
                          </label>
                          <input
                            name="address"
                            value={shipping.address}
                            onChange={handleShippingChange}
                            required
                            className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                            placeholder="Calle, número, colonia..."
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleBackToCart}
                          className="flex-1 px-4 py-2.5 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-secondary)] hover:text-[var(--text)] font-semibold text-sm rounded-xl transition-all"
                        >
                          Atrás
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5"
                        >
                          Calcular envío
                        </button>
                      </div>
                    </form>

                    {/* Aviso */}
                    <div className="mt-4 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
                      <Shield size={16} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
                      <span>Verifica que tu dirección sea correcta. Los pedidos enviados a una dirección incorrecta no pueden ser reembolsados.</span>
                    </div>
                  </div>
                )}

                {/* ===== STEP 3: SELECCIONAR ENVÍO ===== */}
                {step === 3 && (
                  <div className="mt-6">
                    {/* Dirección resumen */}
                    <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl mb-4">
                      <div className="flex justify-between items-start">
                        <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          <strong className="text-[var(--text)]">{shipping.name}</strong>
                          <br />
                          {shipping.address}
                          <br />
                          {shipping.city}, {shipping.state} {shipping.zip}
                          <br />
                          {COUNTRIES.find(c => c.code === shipping.country)?.name || shipping.country}
                        </div>
                        <button
                          onClick={handleBackToAddress}
                          className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </div>

                    <ShippingQuotes
                      shipping={shipping}
                      selected={selectedQuote}
                      onSelect={setSelectedQuote}
                    />

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleBackToAddress}
                        className="flex-1 px-4 py-2.5 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-secondary)] hover:text-[var(--text)] font-semibold text-sm rounded-xl transition-all"
                      >
                        Atrás
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={!selectedQuote || checkoutLoading}
                        className="flex-1 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        {checkoutLoading ? (
                          'Procesando...'
                        ) : (
                          <>
                            Pagar {selectedQuote && formatPrice(grandTotal)}
                            <ArrowRight size={16} className="inline ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ===== GARANTÍA ===== */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-2 text-[10px] font-medium text-[var(--text-light)] uppercase tracking-wider">
                  <Shield size={14} />
                  Envíos seguros a todo México
                  <span className="w-px h-4 bg-[var(--border)]" />
                  <Truck size={14} />
                  Garantía de devolución
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}