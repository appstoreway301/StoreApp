import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../utils/imageUrl';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function handleAdd(e) {
    e.preventDefault();
    addItem(product);
  }

  const cats = product.categories || [];

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <img src={resolveImageUrl(product.image_url)} alt={product.name} className="product-card-img" />
      <div className="product-card-body">
        <div className="tags-display">
          {cats.map(c => (
            <span key={c.id} className="tag tag-small">{c.name}</span>
          ))}
        </div>
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-price">{formatPrice(product.price_cents)}</p>
        <button onClick={handleAdd} className="btn btn-primary">
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
