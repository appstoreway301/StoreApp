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
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);

  useEffect(() => {
    if (selectedSize && selectedColor) {
      const variant = variants.find(
        v => v.size === selectedSize && v.color === selectedColor
      );
      setSelectedVariant(variant);
      if (variant?.image_url) {
        setCurrentImage(variant.image_url);
      } else {
        setCurrentImage(product?.image_url || null);
      }
    } else {
      setSelectedVariant(null);
    }
  }, [selectedSize, selectedColor, variants, product]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/variants/product/${id}`)
    ])
      .then(([productRes, variantsRes]) => {
        setProduct(productRes.data.product);
        setCurrentImage(productRes.data.product.image_url);
        
        const variantData = variantsRes.data.variants || [];
        setVariants(variantData);
        setHasVariants(variantData.length > 0);
        
        if (variantData.length > 0) {
          const availableSizes = [...new Set(variantData.filter(v => v.stock > 0).map(v => v.size))];
          const availableColors = [...new Set(variantData.filter(v => v.stock > 0).map(v => v.color))];
          
          // Si solo hay colores (sin tallas o con "Único")
          if (availableSizes.length === 0 || (availableSizes.length === 1 && availableSizes[0] === 'Único')) {
            if (availableColors.length > 0) {
              const firstAvailable = variantData.find(v => v.stock > 0 && v.color === availableColors[0]);
              if (firstAvailable) {
                setSelectedColor(firstAvailable.color);
                setSelectedVariant(firstAvailable);
                setSelectedSize('Único');
                if (firstAvailable.image_url) {
                  setCurrentImage(firstAvailable.image_url);
                }
              }
            }
          } else {
            // Si hay tallas y colores, seleccionar la primera disponible
            const firstAvailable = variantData.find(v => v.stock > 0);
            if (firstAvailable) {
              setSelectedSize(firstAvailable.size);
              setSelectedColor(firstAvailable.color);
              setSelectedVariant(firstAvailable);
              if (firstAvailable.image_url) {
                setCurrentImage(firstAvailable.image_url);
              }
            } else {
              setSelectedSize(variantData[0]?.size || null);
              setSelectedColor(variantData[0]?.color || null);
              setSelectedVariant(variantData[0] || null);
            }
          }
        }
      })
      .catch(() => {
        setProduct(null);
        setVariants([]);
        setHasVariants(false);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  async function handleAddToCart() {
    if (hasVariants) {
      if (!selectedVariant) {
        alert('Selecciona una talla y color disponibles');
        return;
      }
      if (selectedVariant.stock < quantity) {
        alert(`Solo hay ${selectedVariant.stock} unidades disponibles en ${selectedSize} - ${selectedColor}`);
        return;
      }
      
      const variantImage = selectedVariant.image_url || product.image_url || null;
      
      await addItem({
        ...product,
        variantId: selectedVariant.id,
        size: selectedSize,
        color: selectedColor,
        variantStock: selectedVariant.stock,
        image_url: variantImage,
      }, quantity);
    } else {
      if (product.stock < quantity) {
        alert(`Solo hay ${product.stock} unidades disponibles`);
        return;
      }
      await addItem(product, quantity);
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleSizeSelect(size) {
    const hasStock = variants.some(v => v.size === size && v.stock > 0);
    if (!hasStock) return;
    
    setSelectedSize(size);
    const available = variants.find(v => v.size === size && v.stock > 0);
    if (available) {
      setSelectedColor(available.color);
      setSelectedVariant(available);
      if (available.image_url) {
        setCurrentImage(available.image_url);
      }
    }
  }

  function handleColorSelect(color) {
    if (!selectedSize || selectedSize === 'Único') {
      const hasStock = variants.some(v => v.color === color && v.stock > 0);
      if (!hasStock) return;
      setSelectedColor(color);
      const variant = variants.find(v => v.color === color && v.stock > 0);
      if (variant) {
        setSelectedVariant(variant);
        setSelectedSize('Único');
        if (variant.image_url) {
          setCurrentImage(variant.image_url);
        }
      }
      return;
    }
    const hasStock = variants.some(v => v.color === color && v.size === selectedSize && v.stock > 0);
    if (!hasStock) return;
    setSelectedColor(color);
    const variant = variants.find(v => v.color === color && v.size === selectedSize && v.stock > 0);
    if (variant) {
      setSelectedVariant(variant);
      if (variant.image_url) {
        setCurrentImage(variant.image_url);
      }
    }
  }

  function isSizeAvailable(size) {
    return variants.some(v => v.size === size && v.stock > 0);
  }

  function isColorAvailable(color) {
    if (!selectedSize || selectedSize === 'Único') return variants.some(v => v.color === color && v.stock > 0);
    return variants.some(v => v.color === color && v.size === selectedSize && v.stock > 0);
  }

  const currentStock = hasVariants 
    ? (selectedVariant?.stock || 0)
    : (product?.stock || 0);

  const availableSizes = hasVariants
    ? [...new Set(variants.filter(v => v.stock > 0).map(v => v.size))]
    : (product?.sizes || []);

  const availableColors = hasVariants
    ? (selectedSize && selectedSize !== 'Único'
        ? [...new Set(variants.filter(v => v.size === selectedSize && v.stock > 0).map(v => v.color))]
        : [...new Set(variants.filter(v => v.stock > 0).map(v => v.color))])
    : (product?.colors || []);

  const showSizeSelector = hasVariants && availableSizes.length > 0 && availableSizes[0] !== 'Único';
  const showColorSelector = hasVariants && availableColors.length > 0 && availableColors[0] !== 'Único';

  const imageUrl = currentImage ? resolveImageUrl(currentImage) : null;

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

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <button onClick={() => navigate(-1)} className="product-detail-back">
          <ArrowLeft size={16} />
          VOLVER
        </button>

        <div className="product-detail-grid">
          <div className="product-detail-images">
            <div className="product-detail-main-image">
              {imageUrl ? (
                <img src={imageUrl} alt={product.name} />
              ) : (
                <div className="product-detail-image-placeholder">
                  <span>📦</span>
                  <p className="text-sm text-[var(--text-light)] mt-2">Sin imagen</p>
                </div>
              )}
            </div>
          </div>

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

            <div className="product-detail-stock-info">
              <span className="text-sm text-[var(--text-secondary)]">
                {currentStock > 0 ? (
                  `${currentStock} unidades disponibles`
                ) : (
                  <span className="text-[var(--danger)]">Agotado</span>
                )}
              </span>
            </div>

            {showSizeSelector && (
              <div className="product-detail-option">
                <label className="product-detail-option-label">TALLA</label>
                <div className="product-detail-sizes">
                  {availableSizes.map((size) => {
                    const hasStock = isSizeAvailable(size);
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        disabled={!hasStock}
                        className={`product-detail-size-btn ${
                          isSelected ? 'active' : ''
                        } ${!hasStock ? 'disabled opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {size}
                        {!hasStock && (
                          <span className="block text-[8px] text-[var(--text-light)]">Agotado</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showColorSelector && (
              <div className="product-detail-option">
                <label className="product-detail-option-label">COLOR</label>
                <div className="product-detail-colors">
                  {availableColors.map((color) => {
                    const hasStock = isColorAvailable(color);
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        disabled={!hasStock}
                        className={`product-detail-color-btn ${
                          isSelected ? 'active' : ''
                        } ${!hasStock ? 'disabled opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!hasVariants && product.stock > 0 && (
              <div className="text-sm text-[var(--text-secondary)] mb-2">
                Producto sin tallas específicas - stock general
              </div>
            )}

            <div className="product-detail-option">
              <label className="product-detail-option-label">CANTIDAD</label>
              <div className="product-detail-quantity">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="product-detail-qty-btn"
                  disabled={currentStock === 0}
                >
                  <Minus size={16} />
                </button>
                <span className="product-detail-qty-value">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(quantity + 1, currentStock || quantity))}
                  className="product-detail-qty-btn"
                  disabled={currentStock === 0 || quantity >= currentStock}
                >
                  <Plus size={16} />
                </button>
              </div>
              {currentStock > 0 && (
                <span className="text-xs text-[var(--text-light)] mt-1">
                  Stock disponible: {currentStock} unidades
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className={`product-detail-add-btn ${
                currentStock === 0 ? 'disabled' : added ? 'added' : ''
              }`}
            >
              {currentStock === 0 ? (
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

            {currentStock > 0 && currentStock <= 10 && (
              <p className="product-detail-stock-warning">
                ¡Solo quedan {currentStock} unidades!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}