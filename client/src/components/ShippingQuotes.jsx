import { useState } from 'react';
import { Truck, Clock, Check, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../api/client';

// ==================== LOGOS DE TRANSPORTISTAS ====================
const CarrierLogo = ({ carrier, className = "w-8 h-8" }) => {
  const logos = {
    'fedex': (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="12" fill="#4d148c" />
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="Arial, sans-serif">
          FEDEX
        </text>
      </svg>
    ),
    'dhl': (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="12" fill="#ffcc00" />
        <text x="50" y="58" textAnchor="middle" fill="#d40511" fontSize="28" fontWeight="900" fontFamily="Arial, sans-serif">
          DHL
        </text>
      </svg>
    ),
    'estafeta': (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="12" fill="#e30613" />
        <text x="50" y="48" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="Arial, sans-serif">
          ESTAFETA
        </text>
        <text x="50" y="66" textAnchor="middle" fill="#ffcc00" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif">
          MÉXICO
        </text>
      </svg>
    ),
    'ups': (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="12" fill="#351c75" />
        <text x="50" y="58" textAnchor="middle" fill="#ffcc00" fontSize="28" fontWeight="900" fontFamily="Arial, sans-serif">
          UPS
        </text>
      </svg>
    ),
    'correos': (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="12" fill="#003366" />
        <text x="50" y="52" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">
          CORREOS
        </text>
        <text x="50" y="68" textAnchor="middle" fill="#ffcc00" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif">
          DE MÉXICO
        </text>
      </svg>
    ),
    'default': (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="12" fill="#222" />
        <text x="50" y="55" textAnchor="middle" fontSize="24">
          🚚
        </text>
      </svg>
    )
  };
  
  return logos[carrier?.toLowerCase()] || logos.default;
};

// ==================== COMPONENTE PRINCIPAL ====================
export default function ShippingQuotes({ shipping, onSelect, selected }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  async function fetchQuotes() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/shipping/quote', {
        destination: {
          name: shipping.name,
          street: shipping.address,
          city: shipping.city,
          state: shipping.state,
          country: shipping.country,
          postalCode: shipping.zip,
          phone: shipping.phone || '',
        },
      });
      
      const validQuotes = (data.quotes || [])
        .filter(q => q.priceCents > 0)
        .sort((a, b) => a.priceCents - b.priceCents);
      
      setQuotes(validQuotes);
      setFetched(true);
      
      if (validQuotes.length === 0) {
        setError('No hay opciones de envío disponibles para esta dirección');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al obtener cotizaciones');
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(cents) {
    if (!cents || cents === 0) return '$0.00 MXN';
    
    if (cents > 500) {
      return `$${(cents / 100).toFixed(2)}`;
    }
    
    if (cents < 500) {
      return `$${cents.toFixed(2)}`;
    }
    
    return `$${(cents / 100).toFixed(2)}`;
  }

  function getCarrierColor(carrier) {
    const colors = {
      'fedex': 'border-[#4d148c] bg-[#4d148c]/10',
      'dhl': 'border-[#ffcc00] bg-[#ffcc00]/10',
      'estafeta': 'border-[#e30613] bg-[#e30613]/10',
      'ups': 'border-[#351c75] bg-[#351c75]/10',
      'correos': 'border-[#003366] bg-[#003366]/10',
    };
    return colors[carrier?.toLowerCase()] || 'border-[var(--border)] bg-[var(--bg)]';
  }

  if (!fetched && !loading) {
    return (
      <div className="shipping-quotes">
        <button 
          type="button" 
          onClick={fetchQuotes}
          className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(232,93,4,0.3)] flex items-center justify-center gap-2"
        >
          <Truck size={18} />
          Calcular envío
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shipping-quotes py-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Calculando opciones de envío...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shipping-quotes">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
          Selecciona tu envío
        </h4>
        <button 
          type="button" 
          onClick={fetchQuotes}
          className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-sm text-[var(--danger)]">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {quotes.length === 0 && !error && (
        <div className="text-center py-6 text-[var(--text-secondary)] text-sm">
          No hay opciones de envío disponibles
        </div>
      )}

      <div className="space-y-2.5">
        {quotes.map((quote, i) => {
          const isSelected = 
            selected?.carrier === quote.carrier &&
            selected?.service === quote.service &&
            selected?.priceCents === quote.priceCents;
          
          const carrierColor = getCarrierColor(quote.carrier);
          const isCheapest = i === 0;
          const isFastest = quotes.length > 1 && i === quotes.length - 1;

          return (
            <div
              key={i}
              onClick={() => onSelect(quote)}
              className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_0_4px_rgba(232,93,4,0.1)]' 
                  : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Logo del carrier */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${carrierColor}`}>
                    <CarrierLogo carrier={quote.carrier} className="w-10 h-10" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text)] uppercase">
                        {quote.carrier}
                      </span>
                      {isCheapest && !isSelected && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-full">
                          Mejor precio
                        </span>
                      )}
                      {isFastest && !isSelected && quotes.length > 2 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 rounded-full">
                          Más rápido
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                      <span>{quote.service}</span>
                      {quote.deliveryEstimate && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {quote.deliveryEstimate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-base font-bold ${
                      isSelected ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                    }`}>
                      {formatPrice(quote.priceCents)}
                    </span>
                    <span className="block text-[9px] font-bold text-[var(--text-light)] uppercase tracking-wider">
                      MXN
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              {!isSelected && (
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[var(--accent)]/30 transition-colors pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {quotes.length > 0 && (
        <p className="mt-3 text-[10px] text-[var(--text-light)] text-center">
          Los precios incluyen impuestos y manejo
        </p>
      )}
    </div>
  );
}