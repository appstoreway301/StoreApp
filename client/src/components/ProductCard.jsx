import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../utils/imageUrl';

export default function ProductCard({ product, showSizes = true }) {
  const { addItem } = useCart();

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function handleAdd(e) {
    e.preventDefault();
    addItem(product);
  }

  // Tallas fijas para mostrar (placeholder)
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card-image">
        <img src={resolveImageUrl(product.image_url)} alt={product.name} />
      </div>
      <div className="product-card-info">
        <span className="product-card-category">{product.category || 'COLECCIÓN'}</span>
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-price">{formatPrice(product.price_cents)}</p>
        
        {/* Tallas fijas */}
        {showSizes && (
          <div className="product-card-sizes">
            {sizes.map((size) => (
              <span key={size} className="product-card-size">{size}</span>
            ))}
          </div>
        )}
        
        <button onClick={handleAdd} className="btn btn-primary btn-sm">
          Agregar
        </button>
      </div>
    </Link>
  );
}