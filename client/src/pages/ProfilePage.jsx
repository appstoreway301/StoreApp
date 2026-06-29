// client/src/pages/ProfilePage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Mail, Shield, Package, 
  ChevronDown, ChevronUp, Camera, MapPin, Plus, 
  Trash2, Pencil, Check, LogOut, X
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/imageUrl';

const COUNTRIES = [
  { code: 'MX', name: 'México' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ES', name: 'España' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CA', name: 'Canadá' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'DE', name: 'Alemania' },
  { code: 'FR', name: 'Francia' },
];

const emptyAddress = {
  label: 'Hogar',
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
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Secciones expandibles
  const [openSections, setOpenSections] = useState({
    personal: true,
    password: false,
    email: false,
    addresses: false,
  });

  // Cambiar contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Cambiar email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emError, setEmError] = useState('');
  const [emSuccess, setEmSuccess] = useState('');
  const [emLoading, setEmLoading] = useState(false);

  // Direcciones
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addrError, setAddrError] = useState('');
  const [addrSuccess, setAddrSuccess] = useState('');
  const [addrLoading, setAddrLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      api.get('/orders'),
      api.get('/addresses'),
    ])
      .then(([profileRes, ordersRes, addrRes]) => {
        setProfile(profileRes.data.user);
        setOrders(ordersRes.data.orders || []);
        setAddresses(addrRes.data.addresses || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ==================== AVATAR ====================
  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data: uploadData } = await api.post('/auth/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { data } = await api.put('/auth/avatar', { avatar_url: uploadData.image_url });
      setProfile(data.user);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.avatar_url = data.user.avatar_url;
      localStorage.setItem('user', JSON.stringify(stored));
    } catch {
      // ignore
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function handleRemoveAvatar() {
    try {
      const { data } = await api.put('/auth/avatar', { avatar_url: null });
      setProfile(data.user);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.avatar_url = null;
      localStorage.setItem('user', JSON.stringify(stored));
    } catch {}
  }

  // ==================== CONTRASEÑA ====================
  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword !== confirmNew) {
      setPwError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setPwLoading(true);
    try {
      const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
      setPwSuccess(data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNew('');
    } catch (err) {
      setPwError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setPwLoading(false);
    }
  }

  // ==================== EMAIL ====================
  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmError('');
    setEmSuccess('');

    setEmLoading(true);
    try {
      const { data } = await api.put('/auth/change-email', { newEmail, password: emailPassword });
      setEmSuccess(data.message);
      setProfile(prev => ({ ...prev, email: data.email }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.email = data.email;
      localStorage.setItem('user', JSON.stringify(stored));
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setEmError(err.response?.data?.error || 'Error al cambiar el email');
    } finally {
      setEmLoading(false);
    }
  }

  // ==================== DIRECCIONES ====================
  function openAddressForm(addr = null) {
    if (addr) {
      setEditingAddress(addr.id);
      setAddressForm({
        label: addr.label || 'Hogar',
        name: addr.name || '',
        street: addr.street || '',
        number: addr.number || '',
        neighborhood: addr.neighborhood || '',
        city: addr.city || '',
        state: addr.state || '',
        zip: addr.zip || '',
        country: addr.country || 'MX',
        phone: addr.phone || '',
        references: addr.references || '',
      });
    } else {
      setEditingAddress(null);
      setAddressForm(emptyAddress);
    }
    setAddrError('');
    setAddrSuccess('');
    setShowAddressForm(true);
    setOpenSections(prev => ({ ...prev, addresses: true }));
  }

  function closeAddressForm() {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setAddrError('');
    setAddrSuccess('');
  }

  function buildFullAddress() {
    const parts = [];
    if (addressForm.street) parts.push(addressForm.street);
    if (addressForm.number) parts.push(addressForm.number);
    if (addressForm.neighborhood) parts.push(`(${addressForm.neighborhood})`);
    if (addressForm.references) parts.push(`Ref: ${addressForm.references}`);
    return parts.join(' ');
  }

  async function handleAddressZipBlur() {
    const zip = addressForm.zip;
    if (!zip || zip.length < 3) return;
    const country = addressForm.country || 'MX';
    setZipLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/${country.toLowerCase()}/${zip}`);
      if (res.ok) {
        const data = await res.json();
        const place = data.places?.[0];
        if (place) {
          setAddressForm(prev => ({
            ...prev,
            city: place['place name'] || prev.city,
            state: place['state'] || prev.state,
          }));
        }
      }
    } catch {
      // silent
    } finally {
      setZipLoading(false);
    }
  }

  async function handleSaveAddress(e) {
    e.preventDefault();
    setAddrError('');
    setAddrSuccess('');

    // Validaciones básicas
    if (!addressForm.name.trim()) {
      setAddrError('El nombre completo es requerido');
      return;
    }
    if (!addressForm.street.trim()) {
      setAddrError('La calle es requerida');
      return;
    }
    if (!addressForm.city.trim()) {
      setAddrError('La ciudad es requerida');
      return;
    }
    if (!addressForm.state.trim()) {
      setAddrError('El estado es requerido');
      return;
    }
    if (!addressForm.zip.trim()) {
      setAddrError('El código postal es requerido');
      return;
    }

    const fullAddress = buildFullAddress();

    setAddrLoading(true);
    try {
      const payload = {
        label: addressForm.label,
        name: addressForm.name.trim(),
        address: fullAddress || addressForm.street,
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        zip: addressForm.zip.trim(),
        country: addressForm.country,
        phone: addressForm.phone.trim() || '',
      };

      if (editingAddress) {
        await api.put(`/addresses/${editingAddress}`, payload);
        setAddrSuccess('✅ Dirección actualizada');
      } else {
        await api.post('/addresses', payload);
        setAddrSuccess('✅ Dirección agregada');
      }
      
      const { data } = await api.get('/addresses');
      setAddresses(data.addresses || []);
      
      setTimeout(() => {
        closeAddressForm();
      }, 1000);
      
    } catch (err) {
      setAddrError(err.response?.data?.error || 'Error al guardar la dirección');
    } finally {
      setAddrLoading(false);
    }
  }

  async function handleDeleteAddress(id) {
    if (!confirm('¿Eliminar esta dirección?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {}
  }

  async function handleSetDefault(id) {
    try {
      const { data } = await api.put(`/addresses/${id}/default`);
      setAddresses(data.addresses || []);
    } catch {}
  }

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--text-light)] text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-6">
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg p-4 text-sm">
          Error al cargar el perfil
        </div>
      </div>
    );
  }

  const paidOrders = orders.filter(o => o.status === 'paid');
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.total_cents, 0);

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  return (
    <div className="pt-20 pb-20 min-h-screen bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* ===== HEADER CON FOTO ===== */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 md:p-8 mb-8 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar */}
            <div 
              className="relative w-24 h-24 flex-shrink-0 cursor-pointer rounded-full overflow-hidden border-2 border-[var(--accent)] group mx-auto md:mx-0"
              onClick={() => avatarInputRef.current?.click()}
            >
              {profile.avatar_url ? (
                <img 
                  src={resolveImageUrl(profile.avatar_url)} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-white text-3xl font-black">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {avatarUploading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={20} />
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[var(--text)]">
                  {profile.name}
                </h1>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                    {profile.role === 'admin' ? 'Administrador' : 'Cliente'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#10b981]/10 text-[#10b981]">
                    ✓ Verificado
                  </span>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mt-1">{profile.email}</p>
              {profile.avatar_url && (
                <button 
                  className="mt-2 text-xs font-semibold text-[var(--text-light)] hover:text-[var(--danger)] transition-colors underline-offset-2 hover:underline"
                  onClick={handleRemoveAvatar}
                >
                  Eliminar foto
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
              <span className="block text-2xl font-black text-[var(--text)]">{formatPrice(totalSpent)}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">GASTADO</span>
            </div>
          </div>
        </div>

        {/* ===== ACCIONES RÁPIDAS ===== */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link 
            to="/orders" 
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-full text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all"
          >
            <Package size={18} />
            Mis Pedidos
          </Link>
          <button 
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-full text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all"
            onClick={() => setOpenSections(prev => ({ ...prev, addresses: true }))}
          >
            <MapPin size={18} />
            Direcciones
          </button>
          <button 
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--card-bg)] border border-[var(--danger)]/20 rounded-full text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:border-[var(--danger)] transition-all ml-auto"
            onClick={logout}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>

        {/* ===== SECCIONES ===== */}

        {/* 1. INFORMACIÓN PERSONAL */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl mb-3 overflow-hidden shadow-[var(--shadow-sm)]">
          <button 
            className="flex items-center justify-between w-full px-5 py-4 text-sm font-bold text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
            onClick={() => toggleSection('personal')}
          >
            <span className="flex items-center gap-3">
              <User size={18} className="text-[var(--accent)]" />
              Información Personal
            </span>
            {openSections.personal ? (
              <ChevronUp size={18} className="text-[var(--text-light)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--text-light)]" />
            )}
          </button>
          {openSections.personal && (
            <div className="px-5 pb-5 pt-3 border-t border-[var(--border)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">NOMBRE</p>
                  <p className="text-sm text-[var(--text)] mt-0.5">{profile.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">EMAIL</p>
                  <p className="text-sm text-[var(--text)] mt-0.5">{profile.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">ROL</p>
                  <p className="text-sm text-[var(--text)] mt-0.5">
                    {profile.role === 'admin' ? 'Administrador' : 'Cliente'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">MIEMBRO DESDE</p>
                  <p className="text-sm text-[var(--text)] mt-0.5">{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. CAMBIAR CONTRASEÑA */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl mb-3 overflow-hidden shadow-[var(--shadow-sm)]">
          <button 
            className="flex items-center justify-between w-full px-5 py-4 text-sm font-bold text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
            onClick={() => toggleSection('password')}
          >
            <span className="flex items-center gap-3">
              <Shield size={18} className="text-[var(--accent)]" />
              Cambiar Contraseña
            </span>
            {openSections.password ? (
              <ChevronUp size={18} className="text-[var(--text-light)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--text-light)]" />
            )}
          </button>
          {openSections.password && (
            <div className="px-5 pb-5 pt-3 border-t border-[var(--border)]">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {pwError && (
                  <div className="bg-red-500/10 text-[var(--danger)] border border-red-500/20 rounded-lg p-3 text-sm">
                    {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-lg p-3 text-sm">
                    {pwSuccess}
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmNew}
                    onChange={e => setConfirmNew(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={pwLoading}
                >
                  {pwLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 3. CAMBIAR EMAIL */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl mb-3 overflow-hidden shadow-[var(--shadow-sm)]">
          <button 
            className="flex items-center justify-between w-full px-5 py-4 text-sm font-bold text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
            onClick={() => toggleSection('email')}
          >
            <span className="flex items-center gap-3">
              <Mail size={18} className="text-[var(--accent)]" />
              Cambiar Email
            </span>
            {openSections.email ? (
              <ChevronUp size={18} className="text-[var(--text-light)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--text-light)]" />
            )}
          </button>
          {openSections.email && (
            <div className="px-5 pb-5 pt-3 border-t border-[var(--border)]">
              <form onSubmit={handleChangeEmail} className="space-y-4">
                {emError && (
                  <div className="bg-red-500/10 text-[var(--danger)] border border-red-500/20 rounded-lg p-3 text-sm">
                    {emError}
                  </div>
                )}
                {emSuccess && (
                  <div className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-lg p-3 text-sm">
                    {emSuccess}
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                    Nuevo email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                    placeholder="nuevo@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                    Confirmar con tu contraseña
                  </label>
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={e => setEmailPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={emLoading}
                >
                  {emLoading ? 'Actualizando...' : 'Actualizar Email'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 4. DIRECCIONES DE ENVÍO */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl mb-3 overflow-hidden shadow-[var(--shadow-sm)]">
          <button 
            className="flex items-center justify-between w-full px-5 py-4 text-sm font-bold text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
            onClick={() => toggleSection('addresses')}
          >
            <span className="flex items-center gap-3">
              <MapPin size={18} className="text-[var(--accent)]" />
              Direcciones de Envío
              <span className="text-[10px] font-bold text-[var(--text-light)] bg-[var(--bg)] px-2.5 py-0.5 rounded-full">
                {addresses.length}/3
              </span>
            </span>
            {openSections.addresses ? (
              <ChevronUp size={18} className="text-[var(--text-light)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--text-light)]" />
            )}
          </button>
          {openSections.addresses && (
            <div className="px-5 pb-5 pt-3 border-t border-[var(--border)]">
              {addresses.length === 0 && !showAddressForm && (
                <p className="text-[var(--text-secondary)] text-sm py-3">
                  No tienes direcciones guardadas.
                </p>
              )}

              {/* Lista de direcciones */}
              {!showAddressForm && (
                <div className="space-y-3 py-2">
                  {addresses.map(addr => (
                    <div 
                      key={addr.id} 
                      className={`relative p-4 bg-[var(--bg)] border rounded-xl transition-all ${
                        addr.is_default 
                          ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                          : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      {addr.is_default && (
                        <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[var(--accent)] text-white rounded-full">
                          Predeterminada
                        </span>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
                        {addr.label}
                      </p>
                      <div className="text-sm text-[var(--text-secondary)] leading-relaxed mt-1">
                        <strong className="text-[var(--text)]">{addr.name}</strong>
                        <br />
                        {addr.address}
                        <br />
                        {addr.city}, {addr.state} {addr.zip}
                        <br />
                        {COUNTRIES.find(c => c.code === addr.country)?.name || addr.country}
                        {addr.phone && <><br />{addr.phone}</>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {!addr.is_default && (
                          <button 
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 px-3 py-1.5 rounded-lg transition-all border border-[var(--accent)]/20 hover:border-[var(--accent)]"
                            onClick={() => handleSetDefault(addr.id)}
                          >
                            <Check size={13} /> Predeterminada
                          </button>
                        )}
                        <button 
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] px-3 py-1.5 rounded-lg transition-all border border-[var(--border)] hover:border-[var(--border-hover)]"
                          onClick={() => openAddressForm(addr)}
                        >
                          <Pencil size={13} /> Editar
                        </button>
                        <button 
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10 px-3 py-1.5 rounded-lg transition-all border border-[var(--danger)]/20 hover:border-[var(--danger)]"
                          onClick={() => handleDeleteAddress(addr.id)}
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario de dirección - MEJORADO */}
              {showAddressForm ? (
                <form onSubmit={handleSaveAddress} className="pt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-[var(--text)]">
                      {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
                    </h4>
                    <button
                      type="button"
                      onClick={closeAddressForm}
                      className="p-1 rounded-lg hover:bg-[var(--bg)] transition-colors"
                    >
                      <X size={18} className="text-[var(--text-light)]" />
                    </button>
                  </div>

                  {addrError && (
                    <div className="bg-red-500/10 text-[var(--danger)] border border-red-500/20 rounded-lg p-3 text-sm mb-4">
                      {addrError}
                    </div>
                  )}
                  {addrSuccess && (
                    <div className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-lg p-3 text-sm mb-4">
                      {addrSuccess}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Etiqueta */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Etiqueta *
                      </label>
                      <select
                        value={addressForm.label}
                        onChange={e => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                        required
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      >
                        <option value="Hogar">🏠 Hogar</option>
                        <option value="Trabajo">💼 Trabajo</option>
                        <option value="Otro">📍 Otro</option>
                      </select>
                    </div>

                    {/* Nombre completo */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Nombre completo *
                      </label>
                      <input
                        value={addressForm.name}
                        onChange={e => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>

                    {/* Calle */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Calle *
                      </label>
                      <input
                        value={addressForm.street}
                        onChange={e => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                        required
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Ej: Av. Reforma"
                      />
                    </div>

                    {/* Número */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Número
                      </label>
                      <input
                        value={addressForm.number}
                        onChange={e => setAddressForm(prev => ({ ...prev, number: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Ej: 123"
                      />
                    </div>

                    {/* Colonia */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Colonia
                      </label>
                      <input
                        value={addressForm.neighborhood}
                        onChange={e => setAddressForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Ej: Centro"
                      />
                    </div>

                    {/* Referencias */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Referencias
                      </label>
                      <input
                        value={addressForm.references}
                        onChange={e => setAddressForm(prev => ({ ...prev, references: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Ej: Entre calle 1 y 2"
                      />
                    </div>

                    {/* País */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        País *
                      </label>
                      <select
                        value={addressForm.country}
                        onChange={e => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                        required
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Código postal */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Código postal * {zipLoading && '🔍'}
                      </label>
                      <input
                        value={addressForm.zip}
                        onChange={e => setAddressForm(prev => ({ ...prev, zip: e.target.value }))}
                        onBlur={handleAddressZipBlur}
                        required
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Ej: 83000"
                      />
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Estado *
                      </label>
                      <input
                        value={addressForm.state}
                        onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                        required
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Ej: Sonora"
                      />
                    </div>

                    {/* Ciudad */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Ciudad *
                      </label>
                      <input
                        value={addressForm.city}
                        onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                        required
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Ej: Hermosillo"
                      />
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        Teléfono
                      </label>
                      <input
                        value={addressForm.phone}
                        onChange={e => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                        type="tel"
                        className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        placeholder="Ej: 662 123 4567"
                      />
                    </div>
                  </div>

                  {/* Vista previa de la dirección */}
                  {addressForm.street && (
                    <div className="mt-3 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                        📍 Vista previa:
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {buildFullAddress()}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button 
                      type="button" 
                      className="px-5 py-2.5 bg-[var(--border)] hover:bg-[var(--border-hover)] text-[var(--text)] font-semibold text-sm rounded-lg transition-colors"
                      onClick={closeAddressForm}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={addrLoading}
                    >
                      {addrLoading ? 'Guardando...' : 'Guardar Dirección'}
                    </button>
                  </div>
                </form>
              ) : (
                addresses.length < 3 && (
                  <button 
                    className="flex items-center gap-2 mt-3 px-4 py-2.5 bg-[var(--bg)] border border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all"
                    onClick={() => openAddressForm()}
                  >
                    <Plus size={16} /> Agregar Dirección
                  </button>
                )
              )}

              {addresses.length >= 3 && !showAddressForm && (
                <p className="text-sm text-[var(--text-light)] py-2">
                  Has alcanzado el límite de 3 direcciones.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}