import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../utils/imageUrl';

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setSelectedImage(data.product.image_url);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  async function handleAdd() {
    await addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found. <Link to="/">Go back</Link></p>;

  const allImages = [
    product.image_url,
    ...(product.images || []).map(img => img.image_url),
  ].filter(Boolean).map(resolveImageUrl);

  return (
    <div className="product-detail">
      <Link to="/" className="back-link">&larr; Back to products</Link>
      <div className="product-detail-content">
        <div className="product-images-col">
          <img
            src={selectedImage || product.image_url}
            alt={product.name}
            className="product-detail-img"
          />
          {allImages.length > 1 && (
            <div className="product-thumbnails">
              {allImages.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${product.name} ${i + 1}`}
                  className={`product-thumb ${selectedImage === url ? 'thumb-active' : ''}`}
                  onClick={() => setSelectedImage(url)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="product-detail-info">
          <div className="tags-display" style={{ marginBottom: '0.3rem' }}>
            {(product.categories || []).map(c => (
              <span key={c.id} className="tag tag-small">{c.name}</span>
            ))}
          </div>
          <h1>{product.name}</h1>
          <p className="product-detail-price">{formatPrice(product.price_cents)}</p>
          <p>{product.description}</p>
          <p className="stock-info">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          <div className="add-to-cart-row">
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="qty-input"
            />
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={product.stock === 0}
            >
              {added ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
