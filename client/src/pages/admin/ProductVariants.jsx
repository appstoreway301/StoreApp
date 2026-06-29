import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Save, RefreshCw, AlertCircle, Upload } from 'lucide-react';
import api from '../../api/client';

export default function ProductVariants({ productId, productName, onClose }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [allSizes, setAllSizes] = useState([]);
  const [allColors, setAllColors] = useState([]);
  const [sizesLoading, setSizesLoading] = useState(true);

  const [selectedSizeIds, setSelectedSizeIds] = useState([]);
  const [selectedColorIds, setSelectedColorIds] = useState([]);

  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (productId) {
      loadAllData();
    }
  }, [productId]);

  async function loadAllData() {
    setLoading(true);
    setError('');
    try {
      const [variantsRes, sizesRes, colorsRes] = await Promise.all([
        api.get(`/variants/product/${productId}`),
        api.get('/admin/sizes'),
        api.get('/admin/colors')
      ]);

      setVariants(variantsRes.data.variants || []);
      
      const globalSizes = sizesRes.data.sizes || [];
      const globalColors = colorsRes.data.colors || [];
      setAllSizes(globalSizes);
      setAllColors(globalColors);

      const existingSizeIds = [...new Set(variantsRes.data.variants.map(v => {
        const found = globalSizes.find(s => s.name === v.size);
        return found ? found.id : null;
      }).filter(id => id !== null))];

      const existingColorIds = [...new Set(variantsRes.data.variants.map(v => {
        const found = globalColors.find(c => c.name === v.color);
        return found ? found.id : null;
      }).filter(id => id !== null))];

      setSelectedSizeIds(existingSizeIds);
      setSelectedColorIds(existingColorIds);
      setSizesLoading(false);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(file) {
    if (!file) return;
    
    setUploadingImage(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const { data } = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return data.image_url;
    } catch (err) {
      setError('Error al subir la imagen');
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleFileSelect(e, variantId) {
    const file = e.target.files[0];
    if (!file) return;
    
    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      setEditImageUrl(imageUrl);
      await handleSaveImage(variantId, imageUrl);
    }
    e.target.value = '';
  }

  async function handleSaveImage(variantId, imageUrl = null) {
    const urlToSave = imageUrl || editImageUrl.trim();
    if (!urlToSave) {
      setError('Ingresa una URL de imagen o selecciona un archivo');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const variant = variants.find(v => v.id === variantId);
      await api.put(`/variants/${variantId}`, {
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        stock: variant.stock,
        image_url: urlToSave,
      });

      setSuccess('✅ Imagen actualizada');
      setEditingVariantId(null);
      setEditImageUrl('');
      loadAllData();
    } catch (err) {
      console.error('Error al guardar imagen:', err);
      setError(err.response?.data?.error || 'Error al guardar imagen');
    } finally {
      setSaving(false);
    }
  }

  function startEditImage(variant) {
    setEditingVariantId(variant.id);
    setEditImageUrl(variant.image_url || '');
  }

  function cancelEditImage() {
    setEditingVariantId(null);
    setEditImageUrl('');
  }

  function toggleSize(sizeId) {
    setSelectedSizeIds(prev => 
      prev.includes(sizeId) 
        ? prev.filter(id => id !== sizeId)
        : [...prev, sizeId]
    );
  }

  function toggleColor(colorId) {
    setSelectedColorIds(prev => 
      prev.includes(colorId) 
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    );
  }

  async function handleSaveSelections() {
    if (selectedSizeIds.length === 0 && selectedColorIds.length === 0) {
      setError('Selecciona al menos una talla o un color');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const selectedSizes = allSizes.filter(s => selectedSizeIds.includes(s.id)).map(s => s.name);
      const selectedColors = allColors.filter(c => selectedColorIds.includes(c.id)).map(c => c.name);

      const sizesToUse = selectedSizes.length > 0 ? selectedSizes : ['Único'];
      const colorsToUse = selectedColors.length > 0 ? selectedColors : ['Único'];

      const existingKeys = new Set(variants.map(v => `${v.size}-${v.color}`));
      const combinations = [];

      for (const size of sizesToUse) {
        for (const color of colorsToUse) {
          const key = `${size}-${color}`;
          if (!existingKeys.has(key)) {
            combinations.push({ size, color });
          }
        }
      }

      await api.put(`/admin/products/${productId}`, {
        size_ids: selectedSizeIds,
        color_ids: selectedColorIds,
      });

      for (const combo of combinations) {
        await api.post('/variants', {
          product_id: productId,
          size: combo.size,
          color: combo.color,
          stock: 0,
        });
      }

      if (combinations.length === 0) {
        setSuccess('✅ Selección actualizada');
      } else {
        setSuccess(`✅ ${combinations.length} combinaciones generadas`);
      }
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateCombinations() {
    if (selectedColorIds.length === 0 && selectedSizeIds.length === 0) {
      setError('Selecciona al menos una talla o un color');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const selectedSizes = allSizes.filter(s => selectedSizeIds.includes(s.id)).map(s => s.name);
      const selectedColors = allColors.filter(c => selectedColorIds.includes(c.id)).map(c => c.name);

      const sizesToUse = selectedSizes.length > 0 ? selectedSizes : ['Único'];
      const colorsToUse = selectedColors.length > 0 ? selectedColors : ['Único'];

      const existingKeys = new Set(variants.map(v => `${v.size}-${v.color}`));
      const combinations = [];

      for (const size of sizesToUse) {
        for (const color of colorsToUse) {
          const key = `${size}-${color}`;
          if (!existingKeys.has(key)) {
            combinations.push({ size, color });
          }
        }
      }

      if (combinations.length === 0) {
        setError('Todas las combinaciones ya existen');
        setGenerating(false);
        return;
      }

      for (const combo of combinations) {
        await api.post('/variants', {
          product_id: productId,
          size: combo.size,
          color: combo.color,
          stock: 0,
        });
      }

      setSuccess(`✅ ${combinations.length} combinaciones generadas`);
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar combinaciones');
    } finally {
      setGenerating(false);
    }
  }

  function handleUpdateStock(id, newStock) {
    if (newStock < 0) return;
    setVariants(prev => prev.map(v => 
      v.id === id ? { ...v, stock: newStock } : v
    ));
  }

  async function handleSaveAllStock() {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      for (const variant of variants) {
        await api.patch(`/variants/${variant.id}/stock`, { 
          stock: variant.stock 
        });
      }
      setSuccess('✅ Stock actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
      loadAllData();
    } catch (err) {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVariant(id) {
    if (!confirm('¿Eliminar esta variante?')) return;
    try {
      await api.delete(`/variants/${id}`);
      loadAllData();
      setSuccess('Variante eliminada');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al eliminar');
    }
  }

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  if (!productId) return null;

  const totalCombinations = (selectedSizeIds.length || 1) * (selectedColorIds.length || 1);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--card-bg)] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text)]">
              Gestionar Stock
            </h3>
            {productName && (
              <p className="text-sm text-[var(--text-secondary)]">{productName}</p>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--text-light)] hover:text-[var(--text)] transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 text-[var(--danger)] border border-red-500/20 rounded-xl p-3 text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-xl p-3 text-sm mb-4">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-2">
              Tallas disponibles
            </label>
            {sizesLoading ? (
              <div className="text-sm text-[var(--text-light)]">Cargando tallas...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allSizes.map(size => (
                  <button
                    key={size.id}
                    onClick={() => toggleSize(size.id)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full border transition-all ${
                      selectedSizeIds.includes(size.id)
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text)]'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
                {allSizes.length === 0 && (
                  <span className="text-sm text-[var(--text-light)]">No hay tallas creadas</span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-2">
              Colores disponibles
            </label>
            {sizesLoading ? (
              <div className="text-sm text-[var(--text-light)]">Cargando colores...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allColors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => toggleColor(color.id)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full border transition-all ${
                      selectedColorIds.includes(color.id)
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text)]'
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
                {allColors.length === 0 && (
                  <span className="text-sm text-[var(--text-light)]">No hay colores creados</span>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSaveSelections}
          disabled={saving || (selectedSizeIds.length === 0 && selectedColorIds.length === 0)}
          className="w-full mb-4 px-4 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando selección...
            </>
          ) : (
            <>
              <Save size={16} />
              Guardar selección de tallas y colores
            </>
          )}
        </button>

        <div className="flex items-center justify-between mb-4 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
          <span className="text-sm font-semibold text-[var(--text)]">
            Total en stock: <span className="text-[var(--accent)]">{totalStock}</span> unidades
          </span>
          <span className="text-xs text-[var(--text-light)]">
            {variants.length} combinaciones
          </span>
        </div>

        <button
          onClick={handleGenerateCombinations}
          disabled={generating || (selectedSizeIds.length === 0 && selectedColorIds.length === 0)}
          className="w-full mb-4 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Generar combinaciones ({selectedSizeIds.length || 0} tallas × {selectedColorIds.length || 0} colores = {totalCombinations})
            </>
          )}
        </button>

        {loading ? (
          <div className="text-center py-8 text-[var(--text-light)]">
            <div className="w-8 h-8 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-3" />
            Cargando variantes...
          </div>
        ) : variants.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-light)]">
            No hay variantes. Selecciona tallas y colores arriba, luego guarda la selección o genera combinaciones.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[50vh]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg)] sticky top-0">
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Talla</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Color</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">SKU</th>
                  <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Stock</th>
                  <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Imagen</th>
                  <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Estado</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {variants.map(v => {
                  const isEditing = editingVariantId === v.id;
                  return (
                    <tr key={v.id} className="border-b border-[var(--border)] hover:bg-[var(--bg)]/50 transition-colors">
                      <td className="px-3 py-2 font-semibold text-[var(--text)]">{v.size}</td>
                      <td className="px-3 py-2 text-[var(--text)]">{v.color}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)] font-mono text-xs">{v.sku || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => handleUpdateStock(v.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isEditing ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editImageUrl}
                                onChange={(e) => setEditImageUrl(e.target.value)}
                                placeholder="URL imagen"
                                className="w-28 px-2 py-1 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                              />
                              <button
                                onClick={() => handleSaveImage(v.id)}
                                className="p-1 text-[#10b981] hover:text-[#059669] transition-colors"
                                title="Guardar imagen"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={cancelEditImage}
                                className="p-1 text-[var(--text-light)] hover:text-[var(--text)] transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, v.id)}
                                className="hidden"
                                id={`file-upload-${v.id}`}
                              />
                              <label
                                htmlFor={`file-upload-${v.id}`}
                                className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg cursor-pointer hover:border-[var(--accent)] transition-all"
                              >
                                <Upload size={12} />
                                Subir
                              </label>
                              <span className="text-[8px] text-[var(--text-light)]">o pega URL</span>
                            </div>
                            {uploadingImage && (
                              <span className="text-xs text-[var(--text-light)]">Subiendo...</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-center">
                            {v.image_url ? (
                              <img 
                                src={v.image_url} 
                                alt={v.color} 
                                className="w-8 h-8 object-cover rounded border border-[var(--border)]"
                              />
                            ) : (
                              <span className="text-xs text-[var(--text-light)]">—</span>
                            )}
                            <button
                              onClick={() => startEditImage(v)}
                              className="p-1 text-[var(--text-light)] hover:text-[var(--accent)] transition-colors"
                              title="Editar imagen"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          v.stock > 0 
                            ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' 
                            : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
                        }`}>
                          {v.stock > 0 ? 'Disponible' : 'Agotado'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeleteVariant(v.id)}
                          className="p-1.5 rounded-lg text-[var(--text-light)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSaveAllStock}
            disabled={saving || variants.length === 0}
            className="flex-1 px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando Stock...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Stock
              </>
            )}
          </button>
          <button
            onClick={loadAllData}
            className="px-5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        <div className="mt-3 text-xs text-[var(--text-light)] text-center">
          Total: {variants.length} combinaciones
        </div>
      </div>
    </div>
  );
}