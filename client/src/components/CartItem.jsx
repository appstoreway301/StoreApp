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

  return (
    <div className="cart-item">
      {/* Imagen */}
      <img 
        src={resolveImageUrl(item.image_url)} 
        alt={item.name} 
        className="cart-item-img" 
      />

      {/* Información */}
      <div className="cart-item-info">
        <h4>{item.name}</h4>
        <p className="cart-item-price">{formatPrice(item.price_cents)}</p>
      </div>

      {/* Selector de cantidad (mejorado) */}
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

      {/* Subtotal */}
      <div className="cart-item-total">
        {formatPrice(item.price_cents * item.quantity)}
      </div>

      {/* Botón eliminar (con ícono) */}
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