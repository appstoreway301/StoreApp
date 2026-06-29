import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, TrendingDown, Package, AlertCircle,
  Search, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, XCircle,
  Sparkles, Target, Award, Clock, Bell, BellRing,
  Shield, ArrowUpRight, Calendar
} from 'lucide-react';
import api from '../../api/client';

/* ─── Design Tokens ─────────────────────────────────────────────── */
const T = {
  bg:      "#09090B",
  card:    "#111217",
  accent:  "#F97316",
  text:    "#FFFFFF",
  muted:   "#A1A1AA",
  border:  "rgba(255,255,255,0.07)",
  danger:  "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
};

/* ─── Motion ────────────────────────────────────────────────────── */
const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

/* ─── Loading ───────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" style={{ background: T.bg }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: T.border, borderTopColor: T.accent }} />
        <p className="text-sm" style={{ color: T.muted }}>Cargando datos...</p>
      </div>
    </div>
  );
}

/* ─── Stat Card ────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div
      className="rounded-2xl p-4 border transition-all hover:border-opacity-50"
      style={{
        background: T.card,
        borderColor: T.border,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold" style={{ color: T.text }}>{value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.muted }}>{label}</p>
        </div>
        <div className="p-2 rounded-xl" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Stock Row ────────────────────────────────────────────────── */
function StockRow({ product, expanded, onToggle, variants, loadingVariants, type }) {
  const alertMap = {
    danger: { icon: <XCircle size={14} />, text: 'AGOTADO', color: T.danger },
    warning: { icon: <AlertTriangle size={14} />, text: `Stock bajo (${product.stock} uds)`, color: T.warning },
    success: { icon: <CheckCircle size={14} />, text: 'Stock saludable', color: T.success },
  };

  const badgeMap = {
    danger: { bg: T.danger, color: '#fff' },
    warning: { bg: T.warning, color: '#fff' },
    success: { bg: T.success, color: '#fff' },
  };

  function formatPrice(cents) {
    if (!cents && cents !== 0) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  }

  const hasVariants = variants && variants.length > 0;
  const totalVariantStock = hasVariants ? variants.reduce((sum, v) => sum + v.stock, 0) : 0;
  const hasOutOfStockVariants = hasVariants && variants.some(v => v.stock === 0);

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all hover:border-opacity-50"
      style={{
        background: T.card,
        borderColor: T.border,
      }}
    >
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 relative">
            <img 
              src={product.image_url || 'https://placehold.co/44x44?text=📦'} 
              alt={product.name} 
              className="w-11 h-11 object-cover rounded-lg"
              style={{ background: T.bg, border: `1px solid ${T.border}` }}
            />
            <div className="absolute -top-1 -right-1">
              <span style={{ color: alertMap[type].color }}>{alertMap[type].icon}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{product.name}</p>
              <span
                className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: `${alertMap[type].color}15`, color: alertMap[type].color }}
              >
                {alertMap[type].text}
              </span>
            </div>
            <p className="text-xs" style={{ color: T.muted }}>{product.category || 'Sin categoría'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: badgeMap[type].bg, color: badgeMap[type].color }}
          >
            {product.stock} uds
          </span>
          {hasVariants && totalVariantStock !== product.stock && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: T.muted, border: `1px solid ${T.border}` }}>
              {totalVariantStock} vars
            </span>
          )}
          <span className="text-sm font-semibold" style={{ color: T.text }}>
            {formatPrice(product.price_cents)}
          </span>
          <ChevronDown
            size={16}
            style={{ color: T.muted, transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
          {loadingVariants ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: T.border, borderTopColor: T.accent }} />
              <span className="text-xs ml-3" style={{ color: T.muted }}>Cargando...</span>
            </div>
          ) : hasVariants ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: T.muted }}>
                  <Target size={13} style={{ color: T.accent }} />
                  Stock por talla y color
                </p>
                {hasOutOfStockVariants && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: T.danger }}>
                    Variantes agotadas
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {variants.map(v => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                      v.stock > 0 ? '' : 'opacity-60'
                    }`}
                    style={{
                      background: v.stock > 0 ? 'rgba(255,255,255,0.04)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${v.stock > 0 ? T.border : 'rgba(239,68,68,0.2)'}`,
                    }}
                  >
                    <span style={{ color: T.text }}>{v.size} · {v.color}</span>
                    <span className="font-bold" style={{ color: v.stock > 0 ? T.text : T.danger }}>
                      {v.stock}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs mt-2 pt-2" style={{ color: T.muted, borderTop: `1px solid ${T.border}` }}>
                <span>Variantes: <strong style={{ color: T.text }}>{variants.length}</strong></span>
                <span>Stock total: <strong style={{ color: T.accent }}>{totalVariantStock}</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center py-3" style={{ color: T.muted }}>Sin variantes</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function Stock() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [productVariants, setProductVariants] = useState({});
  const [loadingVariants, setLoadingVariants] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stock');
      setData(data);
    } catch {
      setError('Error al cargar datos de stock');
    } finally {
      setLoading(false);
    }
  }

  async function loadProductVariants(productId) {
    if (productVariants[productId]) return;
    setLoadingVariants(prev => ({ ...prev, [productId]: true }));
    try {
      const { data } = await api.get(`/variants/product/${productId}`);
      setProductVariants(prev => ({ ...prev, [productId]: data.variants || [] }));
    } catch {
      // ignore
    } finally {
      setLoadingVariants(prev => ({ ...prev, [productId]: false }));
    }
  }

  function toggleProduct(productId) {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(productId);
      loadProductVariants(productId);
    }
  }

  function formatPrice(cents) {
    if (!cents && cents !== 0) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  }

  const stats = data?.stats || {};
  const products = data?.products || [];
  const sales = data?.sales || [];
  const salesByDate = data?.salesByDate || [];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const outOfStock = filteredProducts.filter(p => p.stock === 0 && p.active);
  const lowStock = filteredProducts.filter(p => p.stock > 0 && p.stock <= 5 && p.active);
  const healthyStock = filteredProducts.filter(p => p.stock > 5 && p.active);

  const maxOrders = Math.max(...salesByDate.map(d => d.orders), 1);
  const maxRevenue = Math.max(...salesByDate.map(d => d.revenue), 1);

  if (loading) return <LoadingScreen />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: T.bg }}>
        <p style={{ color: T.danger }}>{error || 'Error al cargar datos'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: T.bg }}>

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">

        {/* ═══ HEADER ═══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: T.text }}>
              Stock
            </h1>
            <p className="text-sm" style={{ color: T.muted }}>
              Gestiona el inventario y analiza las ventas
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: T.accent, color: '#fff' }}
          >
            <BarChart3 size={16} />
            Actualizar
          </button>
        </motion.div>

        {/* ═══ ALERTAS ══════════════════════════════════════════════ */}
        {(stats.outOfStock > 0 || stats.lowStock > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.outOfStock > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.15)` }}>
                <XCircle size={16} className="text-red-400" />
                <p className="text-sm" style={{ color: T.text }}>{stats.outOfStock} productos agotados</p>
              </div>
            )}
            {stats.lowStock > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: `1px solid rgba(245,158,11,0.15)` }}>
                <AlertTriangle size={16} className="text-yellow-400" />
                <p className="text-sm" style={{ color: T.text }}>{stats.lowStock} productos con stock bajo</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ STATS ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Ventas" value={stats.totalOrders || 0} icon={TrendingUp} color="#3b82f6" />
          <StatCard label="Ingresos" value={formatPrice(stats.totalRevenue || 0)} icon={Award} color="#10b981" />
          <StatCard label="Pendientes" value={stats.pendingOrders || 0} icon={Clock} color="#f59e0b" />
          <StatCard label="Stock total" value={stats.totalStock || 0} icon={Package} color="#8b5cf6" />
          <StatCard label="Agotados" value={stats.outOfStock || 0} icon={AlertCircle} color="#ef4444" />
          <StatCard label="Stock bajo" value={stats.lowStock || 0} icon={AlertTriangle} color="#f59e0b" />
        </div>

        {/* ═══ TABS ══════════════════════════════════════════════════ */}
        <div className="flex gap-2 pb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          {[
            { id: 'overview', label: '📦 Resumen' },
            { id: 'sales', label: '📊 Ventas' },
            { id: 'charts', label: '📈 Gráficas' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
                tab === t.id ? 'text-white' : ''
              }`}
              style={
                tab === t.id
                  ? { background: T.accent }
                  : { color: T.muted, background: 'transparent' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ CONTENIDO ════════════════════════════════════════════ */}

        {/* ── TAB: OVERVIEW ── */}
        {tab === 'overview' && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="space-y-4"
          >
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: T.muted }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${T.border}`,
                    color: T.text,
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = T.accent}
                  onBlur={e => e.currentTarget.style.borderColor = T.border}
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${T.border}`,
                  color: T.text,
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e => e.currentTarget.style.borderColor = T.border}
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                onClick={() => { setSearchTerm(''); setFilterCategory('all'); }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ color: T.muted, border: `1px solid ${T.border}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
              >
                Limpiar
              </button>
            </div>

            {/* Product Lists */}
            {outOfStock.length > 0 && (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: T.danger }}>
                  <BellRing size={16} style={{ color: T.danger }} />
                  Agotados ({outOfStock.length})
                </h2>
                <div className="space-y-2.5">
                  {outOfStock.map((p) => (
                    <StockRow
                      key={p.id}
                      product={p}
                      expanded={expandedProduct === p.id}
                      onToggle={() => toggleProduct(p.id)}
                      variants={productVariants[p.id] || []}
                      loadingVariants={loadingVariants[p.id]}
                      type="danger"
                    />
                  ))}
                </div>
              </>
            )}

            {lowStock.length > 0 && (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: T.warning }}>
                  <Bell size={16} style={{ color: T.warning }} />
                  Stock Bajo ({lowStock.length})
                </h2>
                <div className="space-y-2.5">
                  {lowStock.map((p) => (
                    <StockRow
                      key={p.id}
                      product={p}
                      expanded={expandedProduct === p.id}
                      onToggle={() => toggleProduct(p.id)}
                      variants={productVariants[p.id] || []}
                      loadingVariants={loadingVariants[p.id]}
                      type="warning"
                    />
                  ))}
                </div>
              </>
            )}

            {healthyStock.length > 0 && (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: T.success }}>
                  <CheckCircle size={16} style={{ color: T.success }} />
                  Stock Saludable ({healthyStock.length})
                </h2>
                <div className="space-y-2.5">
                  {healthyStock.map((p) => (
                    <StockRow
                      key={p.id}
                      product={p}
                      expanded={expandedProduct === p.id}
                      onToggle={() => toggleProduct(p.id)}
                      variants={productVariants[p.id] || []}
                      loadingVariants={loadingVariants[p.id]}
                      type="success"
                    />
                  ))}
                </div>
              </>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package size={40} className="mx-auto mb-3 opacity-30" style={{ color: T.muted }} />
                <p style={{ color: T.muted }}>No se encontraron productos</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: SALES ── */}
        {tab === 'sales' && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: T.text }}>
                Top productos más vendidos
              </h2>
              <span className="text-xs" style={{ color: T.muted }}>{sales.length} productos</span>
            </div>

            {sales.length === 0 ? (
              <div className="text-center py-12">
                <Package size={40} className="mx-auto mb-3 opacity-30" style={{ color: T.muted }} />
                <p style={{ color: T.muted }}>No hay ventas aún</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border" style={{ background: T.card, borderColor: T.border }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: T.border }}>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>#</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>Producto</th>
                        <th className="px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>Unidades</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((s, i) => (
                        <tr key={s.product_id} className="border-b last:border-0" style={{ borderColor: T.border }}>
                          <td className="px-4 py-2.5 font-bold" style={{ color: T.muted }}>#{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium" style={{ color: T.text }}>{s.product_name}</td>
                          <td className="px-4 py-2.5 text-center font-bold" style={{ color: T.text }}>{s.total_sold}</td>
                          <td className="px-4 py-2.5 text-right font-bold" style={{ color: T.accent }}>{formatPrice(s.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: CHARTS ── */}
        {tab === 'charts' && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="space-y-6"
          >
            {salesByDate.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 size={40} className="mx-auto mb-3 opacity-30" style={{ color: T.muted }} />
                <p style={{ color: T.muted }}>No hay datos de ventas en los últimos 30 días</p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl p-5 border" style={{ background: T.card, borderColor: T.border }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-5" style={{ color: T.text }}>
                    <TrendingUp size={16} style={{ color: T.accent }} />
                    Pedidos por día
                    <span className="text-[10px] font-normal" style={{ color: T.muted }}>(últimos 30 días)</span>
                  </h3>
                  <div className="flex items-end gap-1 h-48 overflow-x-auto pb-1">
                    {salesByDate.map((d, i) => {
                      const height = Math.max((d.orders / maxOrders) * 100, 3);
                      return (
                        <div key={i} className="flex flex-col items-center min-w-[28px] flex-1">
                          <span className="text-[7px] font-bold mb-0.5 opacity-0 hover:opacity-100 transition-opacity" style={{ color: T.muted }}>{d.orders}</span>
                          <div
                            className="w-full max-w-[24px] rounded-t-sm"
                            style={{
                              height: `${height}%`,
                              minHeight: '3px',
                              background: `linear-gradient(to top, ${T.accent}, #ea580c)`,
                            }}
                          />
                          <span className="text-[6px] mt-0.5" style={{ color: T.muted }}>{formatDate(d.date)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl p-5 border" style={{ background: T.card, borderColor: T.border }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-5" style={{ color: T.text }}>
                    <Award size={16} className="text-emerald-500" />
                    Ingresos por día
                    <span className="text-[10px] font-normal" style={{ color: T.muted }}>(últimos 30 días)</span>
                  </h3>
                  <div className="flex items-end gap-1 h-48 overflow-x-auto pb-1">
                    {salesByDate.map((d, i) => {
                      const height = Math.max((d.revenue / maxRevenue) * 100, 3);
                      return (
                        <div key={i} className="flex flex-col items-center min-w-[28px] flex-1">
                          <span className="text-[7px] font-bold mb-0.5 opacity-0 hover:opacity-100 transition-opacity" style={{ color: T.muted }}>{formatPrice(d.revenue)}</span>
                          <div
                            className="w-full max-w-[24px] rounded-t-sm"
                            style={{
                              height: `${height}%`,
                              minHeight: '3px',
                              background: `linear-gradient(to top, #10b981, #34d399)`,
                            }}
                          />
                          <span className="text-[6px] mt-0.5" style={{ color: T.muted }}>{formatDate(d.date)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ═══ FOOTER ════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 text-xs" style={{ color: T.muted, borderTop: `1px solid ${T.border}`, opacity: 0.5 }}>
          <span>© {new Date().getFullYear()} KONG MONTOYA</span>
          <span>Última actualización: {new Date().toLocaleString()}</span>
        </div>

      </div>
    </div>
  );
}