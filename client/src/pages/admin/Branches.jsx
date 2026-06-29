import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  MapPin, Phone, Globe, Building2, Store, 
  Package, AlertCircle, CheckCircle, XCircle,
  Save, X, RefreshCw, Search, Filter, TrendingUp,
  Users, Calendar, Clock, Sparkles, Home, Map, Building,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';

const EMPTY_FORM = {
  name: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  zip: '',
  country: 'MX',
  phone: '',
  references: '',
  active: true, // 👈 NUEVO CAMPO
};

const COUNTRIES = [
  { code: 'MX', name: 'México' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CA', name: 'Canadá' },
  { code: 'ES', name: 'España' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
];

function CollapsibleSection({ title, open, onToggle, children, icon: Icon, badge }) {
  return (
    <motion.div 
      className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg shadow-[var(--border)]/10 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--bg)]/50 transition-colors"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-[var(--accent)]" />}
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">{title}</span>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              {badge}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-[var(--text-light)]"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6 pt-2 border-t border-[var(--border)] overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StockRow({ item, onSave }) {
  const rowClass = item.quantity === 0
    ? 'border-red-500/30 bg-red-500/5'
    : item.quantity <= 5
      ? 'border-yellow-500/30 bg-yellow-500/5'
      : 'border-[var(--border)] bg-[var(--bg)]';
  
  const badgeClass = item.quantity === 0
    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
    : item.quantity <= 5
      ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20'
      : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';

  const iconMap = {
    0: <XCircle size={14} className="text-red-400" />,
    low: <AlertCircle size={14} className="text-yellow-400" />,
    ok: <CheckCircle size={14} className="text-emerald-400" />
  };

  const statusIcon = item.quantity === 0 ? iconMap[0] : item.quantity <= 5 ? iconMap.low : iconMap.ok;

  return (
    <motion.div 
      className={`flex items-center gap-3 p-3 rounded-xl border ${rowClass} transition-all hover:shadow-md`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex-shrink-0 relative">
        <img
          src={item.image_url || 'https://placehold.co/40x40?text=📦'}
          alt={item.name}
          className="w-10 h-10 object-cover rounded-lg border border-[var(--border)]"
        />
        <div className="absolute -top-1 -right-1">
          {statusIcon}
        </div>
      </div>
      <span className="flex-1 text-sm font-medium text-[var(--text)] truncate">{item.name}</span>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeClass}`}>
        {item.quantity} unidades
      </span>
      <input
        type="number"
        min="0"
        defaultValue={item.quantity}
        className="w-20 px-3 py-1.5 text-center bg-[var(--card-bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
        onKeyDown={e => e.key === 'Enter' && onSave(item.product_id, e.target.value)}
        onBlur={e => {
          const val = parseInt(e.target.value, 10);
          if (val !== item.quantity) {
            onSave(item.product_id, e.target.value);
          }
        }}
      />
    </motion.div>
  );
}

// 👇 COMPONENTE TOGGLE
function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
        value 
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' 
          : 'bg-red-500/10 border border-red-500/20 text-red-500'
      }`}
    >
      {value ? (
        <ToggleRight size={20} className="text-emerald-500" />
      ) : (
        <ToggleLeft size={20} className="text-red-500" />
      )}
      <span className="text-sm font-semibold">
        {label || (value ? 'Activo' : 'Inactivo')}
      </span>
    </button>
  );
}

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  const [stockBranchId, setStockBranchId] = useState(null);
  const [stock, setStock] = useState([]);
  const [stockStats, setStockStats] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);

  const [open, setOpen] = useState({ addBranch: false, branches: true });
  const toggleSection = key => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  async function loadBranches() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/branches');
      setBranches(data.branches);
    } catch {
      setError('Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  }

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOpen(prev => ({ ...prev, addBranch: false }));
  }

  function buildAddress() {
    const parts = [];
    if (form.street) parts.push(form.street);
    if (form.number) parts.push(form.number);
    if (form.neighborhood) parts.push(form.neighborhood);
    if (form.references) parts.push(`(${form.references})`);
    return parts.join(' ');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim()) {
      setError('El nombre de la sucursal es requerido');
      return;
    }
    if (!form.street.trim() && !form.city.trim()) {
      setError('La dirección es requerida (calle o ciudad)');
      return;
    }

    const fullAddress = buildAddress();

    const payload = {
      name: form.name.trim(),
      address: fullAddress || '',
      city: form.city.trim() || '',
      state: form.state.trim() || '',
      zip: form.zip.trim() || '',
      country: form.country || 'MX',
      phone: form.phone.trim() || '',
      active: form.active, // 👈 ENVIAR ESTADO
    };

    try {
      if (editingId) {
        await api.put(`/admin/branches/${editingId}`, payload);
        setSuccess('✅ Sucursal actualizada');
      } else {
        await api.post('/admin/branches', payload);
        setSuccess('✅ Sucursal creada');
      }
      resetForm();
      loadBranches();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  }

  function startEdit(branch) {
    setEditingId(branch.id);
    const addressParts = branch.address || '';
    const parts = addressParts.split(' ');
    const street = parts.filter(p => !p.match(/^\d+$/)).join(' ') || '';
    const number = parts.find(p => p.match(/^\d+$/)) || '';
    
    setForm({
      name: branch.name,
      street: street,
      number: number || '',
      neighborhood: '',
      city: branch.city || '',
      state: branch.state || '',
      zip: branch.zip || '',
      country: branch.country || 'MX',
      phone: branch.phone || '',
      references: '',
      active: branch.active !== undefined ? branch.active : true, // 👈 EDITAR ESTADO
    });
    setOpen(prev => ({ ...prev, addBranch: true }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleToggleActive(branch) {
    try {
      await api.put(`/admin/branches/${branch.id}`, {
        ...branch,
        active: !branch.active
      });
      setSuccess(branch.active ? '✅ Sucursal desactivada' : '✅ Sucursal reactivada');
      loadBranches();
    } catch {
      setError('Error al cambiar estado');
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta sucursal? Se eliminarán también sus registros de stock. (Recomendamos desactivar en lugar de eliminar)')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/branches/${id}`);
      setSuccess('✅ Sucursal eliminada');
      if (stockBranchId === id) setStockBranchId(null);
      loadBranches();
    } catch {
      setError('Error al eliminar');
    }
  }

  async function toggleStock(branchId) {
    if (stockBranchId === branchId) {
      setStockBranchId(null);
      setStock([]);
      setStockStats(null);
      return;
    }
    setStockLoading(true);
    try {
      const { data } = await api.get(`/admin/branches/${branchId}/stock`);
      setStock(data.stock);
      setStockStats(data.stats);
      setStockBranchId(branchId);
    } catch {
      setError('Error al cargar stock');
    } finally {
      setStockLoading(false);
    }
  }

  async function saveStock(branchId, productId, quantity) {
    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty < 0) return;
    try {
      const { data } = await api.put(`/admin/branches/${branchId}/stock`, {
        product_id: productId,
        quantity: qty,
      });
      setStock(data.stock);
      setStockStats(data.stats);
      setSuccess('✅ Stock actualizado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar stock');
    }
  }

  const filteredBranches = branches.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = filterActive === 'all' || 
                          (filterActive === 'active' && b.active) ||
                          (filterActive === 'inactive' && !b.active);
    return matchesSearch && matchesActive;
  });

  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.active).length;
  const inactiveBranches = branches.filter(b => !b.active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--text-light)] text-sm font-medium animate-pulse">Cargando sucursales...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-hover)] rounded-full" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--text)]">
                Sucursales
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-0.5 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--accent)]" />
                Gestiona tus puntos de venta y su inventario
              </p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setOpen(prev => ({ ...prev, addBranch: true }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[var(--accent)]/20 transition-all hover:shadow-xl hover:shadow-[var(--accent)]/30"
        >
          <Plus size={18} />
          Nueva Sucursal
        </motion.button>
      </div>

      {/* ===== ESTADÍSTICAS ===== */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-lg shadow-[var(--border)]/10 text-center group hover:-translate-y-1 transition-all duration-300">
          <span className="block text-3xl font-black text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
            {totalBranches}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            <Store size={14} className="inline mr-1" />
            Total
          </span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-lg shadow-[var(--border)]/10 text-center group hover:-translate-y-1 transition-all duration-300">
          <span className="block text-3xl font-black text-[#10b981] group-hover:text-[var(--accent)] transition-colors">
            {activeBranches}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            <CheckCircle size={14} className="inline mr-1 text-[#10b981]" />
            Activas
          </span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-lg shadow-[var(--border)]/10 text-center group hover:-translate-y-1 transition-all duration-300">
          <span className="block text-3xl font-black text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
            {inactiveBranches}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            <XCircle size={14} className="inline mr-1 text-[var(--danger)]" />
            Inactivas
          </span>
        </div>
      </div>

      {/* ===== MENSAJES ===== */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 text-[var(--danger)] border border-red-500/20 rounded-2xl p-4 text-sm backdrop-blur-sm"
        >
          {error}
        </motion.div>
      )}
      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl p-4 text-sm backdrop-blur-sm"
        >
          {success}
        </motion.div>
      )}

      {/* ===== FORMULARIO AGREGAR/EDITAR ===== */}
      <CollapsibleSection
        title={editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
        icon={Building2}
        open={open.addBranch}
        onToggle={() => toggleSection('addBranch')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                Nombre de la sucursal *
              </label>
              <input
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="Ej: Sucursal Centro"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
                required
              />
            </div>

            {/* 📍 Dirección */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                Calle *
              </label>
              <input
                value={form.street}
                onChange={e => setField('street', e.target.value)}
                placeholder="Av. Reforma"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                Número
              </label>
              <input
                value={form.number}
                onChange={e => setField('number', e.target.value)}
                placeholder="123"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                Colonia
              </label>
              <input
                value={form.neighborhood}
                onChange={e => setField('neighborhood', e.target.value)}
                placeholder="Centro"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                Ciudad *
              </label>
              <input
                value={form.city}
                onChange={e => setField('city', e.target.value)}
                placeholder="Hermosillo"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                Estado *
              </label>
              <input
                value={form.state}
                onChange={e => setField('state', e.target.value)}
                placeholder="Sonora"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                Código Postal
              </label>
              <input
                value={form.zip}
                onChange={e => setField('zip', e.target.value)}
                placeholder="83000"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                País
              </label>
              <select
                value={form.country}
                onChange={e => setField('country', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                Teléfono
              </label>
              <input
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="+52 662 123 4567"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                Referencias
              </label>
              <input
                value={form.references}
                onChange={e => setField('references', e.target.value)}
                placeholder="Entre calle 1 y 2, frente al parque"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
              />
            </div>
          </div>

          {/* 👇 TOGGLE ACTIVO/INACTIVO */}
          <div className="flex items-center gap-4 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
              Estado de la sucursal:
            </span>
            <Toggle
              value={form.active}
              onChange={(val) => setField('active', val)}
              label={form.active ? 'Activa' : 'Inactiva'}
            />
            <span className="text-xs text-[var(--text-light)]">
              {form.active 
                ? 'La sucursal estará disponible para ventas y pedidos' 
                : 'La sucursal no estará disponible para ventas ni pedidos'}
            </span>
          </div>

          {/* Vista previa de la dirección */}
          {form.street && (
            <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">📍 Dirección completa:</span>
              <p className="mt-1">{buildAddress()}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-[var(--accent)]/20"
            >
              {editingId ? 'Actualizar Sucursal' : 'Crear Sucursal'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-secondary)] hover:text-[var(--text)] font-semibold text-sm rounded-xl transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </CollapsibleSection>

      {/* ===== BÚSQUEDA Y FILTROS ===== */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-light)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar sucursales..."
            className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-5 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <button
          onClick={() => { setSearchTerm(''); setFilterActive('all'); }}
          className="px-5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all duration-300"
        >
          Limpiar filtros
        </button>
      </div>

      {/* ===== LISTA DE SUCURSALES ===== */}
      <CollapsibleSection
        title="Sucursales"
        icon={Store}
        open={open.branches}
        onToggle={() => toggleSection('branches')}
        badge={branches.length}
      >
        {filteredBranches.length === 0 ? (
          <div className="text-center py-12">
            <Store size={48} className="mx-auto mb-4 text-[var(--text-light)]/30" />
            <p className="text-[var(--text-secondary)] text-sm">
              {searchTerm || filterActive !== 'all' 
                ? 'No se encontraron sucursales con estos filtros'
                : 'No hay sucursales creadas aún'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBranches.map((branch, index) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-[var(--bg)] border rounded-2xl p-5 transition-all hover:shadow-md ${
                  branch.active 
                    ? 'border-[var(--border)]' 
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-black text-[var(--text)] flex items-center gap-2">
                        <Store size={18} className="text-[var(--accent)]" />
                        {branch.name}
                      </h3>
                      {/* 👇 BADGE DE ESTADO CON TOGGLE RÁPIDO */}
                      <button
                        onClick={() => handleToggleActive(branch)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-all hover:scale-105 ${
                          branch.active 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                        }`}
                        title={branch.active ? 'Click para desactivar' : 'Click para reactivar'}
                      >
                        {branch.active ? '🟢 Activa' : '🔴 Inactiva'}
                      </button>
                    </div>
                    
                    <div className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                      {branch.address && (
                        <p className="flex items-center gap-2">
                          <MapPin size={14} className="text-[var(--text-light)]" />
                          {branch.address}
                        </p>
                      )}
                      {branch.city && (
                        <p className="flex items-center gap-2">
                          <Building size={14} className="text-[var(--text-light)]" />
                          {branch.city}
                          {branch.state && `, ${branch.state}`}
                          {branch.country && `, ${COUNTRIES.find(c => c.code === branch.country)?.name || branch.country}`}
                        </p>
                      )}
                      {branch.phone && (
                        <p className="flex items-center gap-2">
                          <Phone size={14} className="text-[var(--text-light)]" />
                          {branch.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
                    <button
                      onClick={() => toggleStock(branch.id)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                        stockBranchId === branch.id
                          ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20'
                          : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Package size={16} />
                      {stockBranchId === branch.id ? 'Ocultar Stock' : 'Gestionar Stock'}
                    </button>
                    <button
                      onClick={() => startEdit(branch)}
                      className="p-2 text-[var(--text-light)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="p-2 text-[var(--text-light)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-xl transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {stockBranchId === branch.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-[var(--border)]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
                        <Package size={16} className="text-[var(--accent)]" />
                        Inventario en {branch.name}
                      </h4>
                      <button
                        onClick={() => toggleStock(branch.id)}
                        className="text-xs text-[var(--text-light)] hover:text-[var(--text)] transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>

                    {stockStats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-3 text-center">
                          <span className="block text-xl font-black text-[var(--text)]">{stockStats.totalProducts}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-light)]">Productos</span>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-3 text-center">
                          <span className="block text-xl font-black text-[var(--text)]">{stockStats.totalStock}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-light)]">Total en Stock</span>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-red-500/30 rounded-xl p-3 text-center">
                          <span className="block text-xl font-black text-[var(--danger)]">{stockStats.outOfStock}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-light)]">Agotados</span>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-yellow-500/30 rounded-xl p-3 text-center">
                          <span className="block text-xl font-black text-[#f59e0b]">{stockStats.lowStock}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-light)]">Stock Bajo</span>
                        </div>
                      </div>
                    )}

                    {stockLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                        <span className="text-sm text-[var(--text-light)] ml-3">Cargando stock...</span>
                      </div>
                    ) : stock.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)] py-4 text-center">
                        No hay productos activos disponibles.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {stock.map(item => (
                          <StockRow 
                            key={item.product_id} 
                            item={item} 
                            onSave={(pid, q) => saveStock(branch.id, pid, q)} 
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-[var(--text-light)] mt-3 text-center">
                      💡 Edita la cantidad y presiona Enter o haz clic fuera para guardar.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </motion.div>
  );
}