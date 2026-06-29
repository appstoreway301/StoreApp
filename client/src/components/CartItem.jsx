import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../utils/imageUrl';

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function handleDecrease() {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  }

  function handleIncrease() {
    updateQuantity(item.id, item.quantity + 1);
  }

  const imageUrl = item.image_url ? resolveImageUrl(item.image_url) : null;

  console.log('🛒 Item del carrito:', item); // 👈 LOG para depurar

  return (
    <div className="cart-item">
      <div className="cart-item-image-wrapper">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={item.name} 
            className="cart-item-img" 
          />
        ) : (
          <div className="cart-item-img-placeholder">
            <span>📦</span>
          </div>
        )}
      </div>

      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.name}</h4>
        <p className="cart-item-price">{formatPrice(item.price_cents)}</p>
        
        {/* 👇 Mostrar talla y color si existen */}
        {item.size || item.color ? (
          <div className="cart-item-variant">
            {item.size && (
              <span className="cart-item-size">
                <strong>Talla:</strong> {item.size}
              </span>
            )}
            {item.color && (
              <span className="cart-item-color">
                <strong>Color:</strong> {item.color}
              </span>
            )}
          </div>
        ) : (
          <div className="cart-item-variant">
            <span className="cart-item-size" style={{ borderColor: 'transparent', background: 'transparent', color: 'var(--text-light)' }}>
              Sin variante
            </span>
          </div>
        )}
      </div>

      <div className="cart-item-actions">
        <button
          className="cart-qty-btn"
          onClick={handleDecrease}
          disabled={item.quantity <= 1}
          aria-label="Disminuir cantidad"
        >
          -
        </button>
        <span className="cart-item-qty">{item.quantity}</span>
        <button
          className="cart-qty-btn"
          onClick={handleIncrease}
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>

      <div className="cart-item-total">
        {formatPrice(item.price_cents * item.quantity)}
      </div>

      <button
        className="cart-item-remove"
        onClick={() => removeItem(item.id)}
        aria-label="Eliminar producto"
        title="Eliminar"
      >
        🗑️
      </button>
    </div>
  );
} 