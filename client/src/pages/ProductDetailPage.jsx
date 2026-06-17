import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../utils/imageUrl';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        // Seleccionar primera talla por defecto si existe
        if (data.product.sizes && data.product.sizes.length > 0) {
          setSelectedSize(data.product.sizes[0]);
        }
        // Seleccionar primer color por defecto si existe
        if (data.product.colors && data.product.colors.length > 0) {
          setSelectedColor(data.product.colors[0]);
        }
      })
      .catch(() => {
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  async function handleAddToCart() {
    if (product.sizes?.length > 0 && !selectedSize) {
      alert('Selecciona una talla');
      return;
    }

    await addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="product-detail-loading-container">
          <div className="product-detail-loading-image"></div>
          <div className="product-detail-loading-info">
            <div className="product-detail-loading-title"></div>
            <div className="product-detail-loading-price"></div>
            <div className="product-detail-loading-description"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-notfound">
        <div className="product-detail-notfound-content">
          <p className="product-detail-notfound-icon">🥊</p>
          <h2>Producto no encontrado</h2>
          <Link to="/products" className="product-detail-notfound-link">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  // Tallas fijas (placeholder si no vienen del backend)
  const sizes = product.sizes?.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
  const colors = product.colors?.length > 0 ? product.colors : ['BLANCO', 'NEGRO', 'GRIS'];

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="product-detail-back"
        >
          <ArrowLeft size={16} />
          VOLVER
        </button>

        <div className="product-detail-grid">
          {/* Images */}
          <div className="product-detail-images">
            <div className="product-detail-main-image">
              <img src={resolveImageUrl(product.image_url)} alt={product.name} />
            </div>
          </div>

          {/* Info */}
          <div className="product-detail-info">
            <span className="product-detail-category">
              {product.category || 'COLECCIÓN'}
            </span>
            <h1 className="product-detail-title">{product.name}</h1>
            <p className="product-detail-price">{formatPrice(product.price_cents)}</p>

            {product.description && (
              <p className="product-detail-description">{product.description}</p>
            )}

            <div className="product-detail-divider" />

            {/* Sizes */}
            <div className="product-detail-option">
              <label className="product-detail-option-label">TALLA</label>
              <div className="product-detail-sizes">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`product-detail-size-btn ${
                      selectedSize === size ? 'active' : ''
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="product-detail-option">
              <label className="product-detail-option-label">COLOR</label>
              <div className="product-detail-colors">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`product-detail-color-btn ${
                      selectedColor === color ? 'active' : ''
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="product-detail-option">
              <label className="product-detail-option-label">CANTIDAD</label>
              <div className="product-detail-quantity">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="product-detail-qty-btn"
                >
                  <Minus size={16} />
                </button>
                <span className="product-detail-qty-value">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="product-detail-qty-btn"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to Cart - estilo exacto a la imagen */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`product-detail-add-btn ${
                product.stock === 0 ? 'disabled' : added ? 'added' : ''
              }`}
            >
              {product.stock === 0 ? (
                'AGOTADO'
              ) : added ? (
                <>
                  <Check size={18} />
                  AÑADIDO
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  AÑADIR AL CARRITO — {formatPrice(product.price_cents * quantity)}
                </>
              )}
            </button>

            {/* Stock warning */}
            {product.stock > 0 && product.stock <= 10 && (
              <p className="product-detail-stock-warning">
                ¡Solo quedan {product.stock} unidades!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}