import { useState } from 'react';
import api from '../api/client';

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
      setQuotes(data.quotes || []);
      setFetched(true);
      if (data.quotes?.length === 0) {
        setError('No shipping options available for this address');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not fetch shipping quotes. Please try again.');
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  if (!fetched && !loading) {
    return (
      <div className="shipping-quotes">
        <button type="button" className="btn btn-primary" onClick={fetchQuotes} style={{ width: '100%' }}>
          Get Shipping Quotes
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shipping-quotes">
        <div className="loading">Fetching shipping rates...</div>
      </div>
    );
  }

  return (
    <div className="shipping-quotes">
      <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', letterSpacing: '-0.2px' }}>
        Select Shipping Method
      </h4>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>
          {error}
          <button type="button" className="btn btn-sm" onClick={fetchQuotes} style={{ marginLeft: '0.75rem' }}>
            Retry
          </button>
        </div>
      )}

      <div className="quotes-list">
        {quotes.map((quote, i) => {
          const isSelected =
            selected?.carrier === quote.carrier &&
            selected?.service === quote.service &&
            selected?.priceCents === quote.priceCents;

          return (
            <div
              key={i}
              className={`quote-option${isSelected ? ' quote-selected' : ''}`}
              onClick={() => onSelect(quote)}
            >
              <div className="quote-info">
                <span className="quote-carrier">{quote.carrier}</span>
                <span className="quote-service">{quote.service}</span>
                {quote.deliveryEstimate && (
                  <span className="quote-estimate">{quote.deliveryEstimate}</span>
                )}
              </div>
              <span className="quote-price">{formatPrice(quote.priceCents)}</span>
            </div>
          );
        })}
      </div>

      {fetched && quotes.length > 0 && (
        <button type="button" className="btn btn-sm" onClick={fetchQuotes} style={{ marginTop: '0.5rem' }}>
          Refresh quotes
        </button>
      )}
    </div>
  );
}
