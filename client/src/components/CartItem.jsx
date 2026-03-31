import { useCart } from '../context/CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="cart-item">
      <img src={item.image_url} alt={item.name} className="cart-item-img" />
      <div className="cart-item-info">
        <h4>{item.name}</h4>
        <p className="cart-item-price">{formatPrice(item.price_cents)}</p>
      </div>
      <div className="cart-item-actions">
        <button
          className="btn btn-sm"
          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
          disabled={item.quantity <= 1}
        >
          -
        </button>
        <span className="cart-item-qty">{item.quantity}</span>
        <button
          className="btn btn-sm"
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
        >
          +
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => removeItem(item.id)}
        >
          Remove
        </button>
      </div>
      <div className="cart-item-total">
        {formatPrice(item.price_cents * item.quantity)}
      </div>
    </div>
  );
}
