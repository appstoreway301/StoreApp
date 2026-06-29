import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUrl';
import api from '../api/client';

export default function ProductCard({ product, showSizes = true }) {
  const [availableSizes, setAvailableSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(true);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  useEffect(() => {
    if (!product || !product.id) return;
    
    setLoadingSizes(true);
    api.get(`/variants/product/${product.id}`)
      .then(({ data }) => {
        const sizes = [...new Set(
          (data.variants || [])
            .filter(v => v.stock > 0)
            .map(v => v.size)
        )];
        setAvailableSizes(sizes);
      })
      .catch(() => {
        setAvailableSizes([]);
      })
      .finally(() => setLoadingSizes(false));
  }, [product.id]);

  const sizesToShow = availableSizes.length > 0 
    ? availableSizes 
    : (product.sizes || []);

  const imageUrl = product.image_url ? resolveImageUrl(product.image_url) : null;

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} />
        ) : (
          <div className="product-card-image-placeholder">
            <span>📦</span>
          </div>
        )}
      </div>
      <div className="product-card-info">
        <span className="product-card-category">{product.category || 'COLECCIÓN'}</span>
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-price">{formatPrice(product.price_cents)}</p>
        
        {showSizes && !loadingSizes && sizesToShow.length > 0 && (
          <div className="product-card-sizes">
            {sizesToShow.map((size) => (
              <span key={size} className="product-card-size">{size}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}