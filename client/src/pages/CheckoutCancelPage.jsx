import { Link } from 'react-router-dom';

export default function CheckoutCancelPage() {
  return (
    <div className="checkout-result">
      <h1>Payment Cancelled</h1>
      <p>Your payment was cancelled. No charges were made.</p>
      <div className="checkout-links">
        <Link to="/cart" className="btn btn-primary">Back to Cart</Link>
        <Link to="/" className="btn">Continue Shopping</Link>
      </div>
    </div>
  );
}
