import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  RefreshCw, XCircle, ExternalLink, FileText, 
  Truck, Package, Calendar, MapPin, User, Phone,
  Clock, CheckCircle, AlertCircle, ShoppingBag,
  Eye, EyeOff, Search, Filter, Download, ChevronDown,
  Sparkles, TrendingUp, Award, Target, Zap, 
  RotateCw, Ban, Send, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  function fetchShipments() {
    setLoading(true);
    setError('');
    api.get('/shipping/admin/shipments')
      .then(({ data }) => {
        setShipments(data.shipments || []);
      })
      .catch(() => {
        setError('Error al cargar los envíos');
        setShipments([]);
      })
      .finally(() => setLoading(false));
  }

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusConfig(status) {
    const configs = {
      'pending': {
        label: 'Pendiente',
        icon: Clock,
        color: '#f59e0b',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        text: 'text-yellow-500',
        dot: 'bg-yellow-500',
        progress: 'w-1/4'
      },
      'generated': {
        label: 'Generado',
        icon: Send,
        color: '#3b82f6',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-500',
        dot: 'bg-blue-500',
        progress: 'w-1/2'
      },
      'in_transit': {
        label: 'En tránsito',
        icon: Truck,
        color: '#8b5cf6',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-500',
        dot: 'bg-purple-500',
        progress: 'w-3/4'
      },
      'delivered': {
        label: 'Entregado',
        icon: CheckCircle,
        color: '#10b981',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-500',
        dot: 'bg-emerald-500',
        progress: 'w-full'
      },
      'error': {
        label: 'Error',
        icon: AlertCircle,
        color: '#ef4444',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-500',
        dot: 'bg-red-500',
        progress: 'w-0'
      },
      'cancelled': {
        label: 'Cancelado',
        icon: Ban,
        color: '#6b7280',
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/20',
        text: 'text-gray-500',
        dot: 'bg-gray-500',
        progress: 'w-0'
      },
    };
    return configs[status] || {
      label: status || 'Desconocido',
      icon: Package,
      color: '#6b7280',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
      text: 'text-gray-500',
      dot: 'bg-gray-500',
      progress: 'w-0'
    };
  }

  function getCarrierColor(carrier) {
    const colors = {
      'fedex': 'border-[#4d148c] bg-[#4d148c]/10 text-[#4d148c]',
      'dhl': 'border-[#ffcc00] bg-[#ffcc00]/10 text-[#d4a800]',
      'estafeta': 'border-[#e30613] bg-[#e30613]/10 text-[#e30613]',
      'ups': 'border-[#351c75] bg-[#351c75]/10 text-[#351c75]',
    };
    return colors[carrier?.toLowerCase()] || 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)]';
  }

  function getCarrierIcon(carrier) {
    const icons = {
      'fedex': '📦',
      'dhl': '✈️',
      'estafeta': '🚚',
      'ups': '📮',
    };
    return icons[carrier?.toLowerCase()] || '📦';
  }

  async function handleRetry(id) {
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      await api.post(`/shipping/admin/shipments/${id}/retry`);
      setSuccess('✅ Reintento de etiqueta iniciado');
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reintentar');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(id) {
    if (!confirm('¿Cancelar este envío?')) return;
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      await api.post(`/shipping/admin/shipments/${id}/cancel`);
      setSuccess('✅ Envío cancelado');
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cancelar');
    } finally {
      setActionLoading(null);
    }
  }

  function toggleExpand(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  // Filtrar y ordenar
  const filteredShipments = shipments
    .filter(s => {
      const matchesSearch = 
        s.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.carrier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shipping_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.order_id?.toString().includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'total-desc') return (b.total_cents || 0) - (a.total_cents || 0);
      if (sortBy === 'total-asc') return (a.total_cents || 0) - (b.total_cents || 0);
      return 0;
    });

  // Estadísticas
  const totalShipments = shipments.length;
  const pendingShipments = shipments.filter(s => s.status === 'pending').length;
  const inTransitShipments = shipments.filter(s => s.status === 'in_transit').length;
  const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;
  const errorShipments = shipments.filter(s => s.status === 'error').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--text-light)] text-sm font-medium animate-pulse">Cargando envíos...</p>
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
                Envíos
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-0.5 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--accent)]" />
                Gestiona y rastrea todos los envíos de KONG MONTOYA
              </p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchShipments}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[var(--accent)]/20 transition-all hover:shadow-xl hover:shadow-[var(--accent)]/30"
        >
          <RefreshCw size={18} />
          Actualizar Envíos
        </motion.button>
      </div>

      {/* ===== ESTADÍSTICAS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-lg shadow-[var(--border)]/10 text-center group hover:-translate-y-1 transition-all duration-300">
          <span className="block text-3xl font-black text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
            {totalShipments}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            <Package size={14} className="inline mr-1" />
            Total
          </span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-lg shadow-[var(--border)]/10 text-center group hover:-translate-y-1 transition-all duration-300">
          <span className="block text-3xl font-black text-[#f59e0b] group-hover:text-[var(--accent)] transition-colors">
            {pendingShipments}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            <Clock size={14} className="inline mr-1 text-[#f59e0b]" />
            Pendientes
          </span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-lg shadow-[var(--border)]/10 text-center group hover:-translate-y-1 transition-all duration-300">
          <span className="block text-3xl font-black text-[#8b5cf6] group-hover:text-[var(--accent)] transition-colors">
            {inTransitShipments}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            <Truck size={14} className="inline mr-1 text-[#8b5cf6]" />
            En tránsito
          </span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-lg shadow-[var(--border)]/10 text-center group hover:-translate-y-1 transition-all duration-300">
          <span className="block text-3xl font-black text-[#10b981] group-hover:text-[var(--accent)] transition-colors">
            {deliveredShipments}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            <CheckCircle size={14} className="inline mr-1 text-[#10b981]" />
            Entregados
          </span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-lg shadow-[var(--border)]/10 text-center group hover:-translate-y-1 transition-all duration-300">
          <span className="block text-3xl font-black text-[var(--danger)] group-hover:text-[var(--accent)] transition-colors">
            {errorShipments}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">
            <AlertCircle size={14} className="inline mr-1 text-[var(--danger)]" />
            Con error
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

      {/* ===== FILTROS Y BÚSQUEDA ===== */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-light)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por #orden, transportista, tracking o ciudad..."
            className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all placeholder:text-[var(--text-light)]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-5 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="generated">Generados</option>
          <option value="in_transit">En tránsito</option>
          <option value="delivered">Entregados</option>
          <option value="error">Con error</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-5 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="total-desc">Mayor valor</option>
          <option value="total-asc">Menor valor</option>
        </select>
        <button
          onClick={() => { setSearchTerm(''); setFilterStatus('all'); setSortBy('newest'); }}
          className="px-5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all duration-300"
        >
          Limpiar filtros
        </button>
      </div>

      {/* ===== LISTA DE ENVÍOS ===== */}
      {filteredShipments.length === 0 ? (
        <div className="text-center py-16 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl">
          <Truck size={48} className="mx-auto mb-4 text-[var(--text-light)]/30" />
          <p className="text-[var(--text-secondary)] text-sm">
            {searchTerm || filterStatus !== 'all' 
              ? 'No se encontraron envíos con estos filtros'
              : 'No hay envíos registrados aún'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShipments.map((shipment, index) => {
            const statusConfig = getStatusConfig(shipment.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedId === shipment.id;
            const carrierColor = getCarrierColor(shipment.carrier);

            return (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg shadow-[var(--border)]/10 hover:shadow-xl transition-all duration-300"
              >
                {/* ===== HEADER DEL ENVÍO ===== */}
                <div 
                  className="p-5 cursor-pointer hover:bg-[var(--bg)]/30 transition-colors"
                  onClick={() => toggleExpand(shipment.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Info izquierda */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Icono del transportista */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${carrierColor} flex-shrink-0`}>
                        {getCarrierIcon(shipment.carrier)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-bold text-[var(--text)]">
                            Orden #{shipment.order_id}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                            <StatusIcon size={12} className="inline mr-1" />
                            {statusConfig.label}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${carrierColor}`}>
                            {shipment.carrier?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-light)] flex-wrap">
                          {shipment.tracking_number && (
                            <span className="font-mono">#{shipment.tracking_number}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDateTime(shipment.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {shipment.shipping_city}, {shipment.shipping_country}
                          </span>
                          <span className="font-bold text-[var(--text)]">
                            {formatPrice(shipment.total_cents)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {shipment.status === 'error' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRetry(shipment.id); }}
                          disabled={actionLoading === shipment.id}
                          className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50"
                          title="Reintentar"
                        >
                          {actionLoading === shipment.id ? (
                            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RotateCw size={16} />
                          )}
                        </button>
                      )}
                      {(shipment.status === 'generated' || shipment.status === 'in_transit') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancel(shipment.id); }}
                          disabled={actionLoading === shipment.id}
                          className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--danger)] hover:text-[var(--danger)] transition-all disabled:opacity-50"
                          title="Cancelar"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                      {shipment.label_url && (
                        <a
                          href={shipment.label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                          title="Descargar etiqueta"
                        >
                          <FileText size={16} />
                        </a>
                      )}
                      {shipment.track_url && (
                        <a
                          href={shipment.track_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--accent]] hover:text-[var(--accent)] transition-all"
                          title="Rastrear"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <div className={`text-[var(--text-light)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-3 w-full bg-[var(--bg)] rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${statusConfig.progress}`}
                      style={{ 
                        width: statusConfig.progress,
                        backgroundColor: statusConfig.color
                      }}
                    />
                  </div>
                </div>

                {/* ===== DETALLES EXPANDIDOS ===== */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-[var(--border)] bg-[var(--bg)]/30 overflow-hidden"
                    >
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Columna izquierda - Información del envío */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-2 flex items-center gap-2">
                              <Truck size={14} className="text-[var(--accent)]" />
                              Información del Envío
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                                <span className="text-[var(--text-light)]">Transportista</span>
                                <span className="font-semibold text-[var(--text)] uppercase">{shipment.carrier}</span>
                              </div>
                              {shipment.service && (
                                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                                  <span className="text-[var(--text-light)]">Servicio</span>
                                  <span className="font-semibold text-[var(--text)]">{shipment.service}</span>
                                </div>
                              )}
                              {shipment.tracking_number && (
                                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                                  <span className="text-[var(--text-light)]">Tracking</span>
                                  <span className="font-mono font-semibold text-[var(--text)]">{shipment.tracking_number}</span>
                                </div>
                              )}
                              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                                <span className="text-[var(--text-light)]">Orden</span>
                                <span className="font-semibold text-[var(--text)]">#{shipment.order_id}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                                <span className="text-[var(--text-light)]">Total</span>
                                <span className="font-bold text-[var(--accent)]">{formatPrice(shipment.total_cents)}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-[var(--text-light)]">Fecha</span>
                                <span className="font-semibold text-[var(--text)]">{formatDateTime(shipment.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {shipment.error_message && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <p className="text-xs text-[var(--danger)]">
                                <strong>Error:</strong> {shipment.error_message}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Columna derecha - Dirección de envío */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-2 flex items-center gap-2">
                              <MapPin size={14} className="text-[var(--accent)]" />
                              Dirección de Envío
                            </h4>
                            <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
                              <p className="text-sm text-[var(--text)] font-semibold">{shipment.shipping_name}</p>
                              <p className="text-sm text-[var(--text-secondary)] mt-1">{shipment.shipping_address}</p>
                              <p className="text-sm text-[var(--text-secondary)]">
                                {shipment.shipping_city}, {shipment.shipping_country}
                              </p>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                            {shipment.status === 'error' && (
                              <button
                                onClick={() => handleRetry(shipment.id)}
                                disabled={actionLoading === shipment.id}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                              >
                                {actionLoading === shipment.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Reintentando...
                                  </>
                                ) : (
                                  <>
                                    <RotateCw size={16} />
                                    Reintentar
                                  </>
                                )}
                              </button>
                            )}
                            {(shipment.status === 'generated' || shipment.status === 'in_transit') && (
                              <button
                                onClick={() => handleCancel(shipment.id)}
                                disabled={actionLoading === shipment.id}
                                className="flex items-center gap-2 px-4 py-2 border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)]/10 font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                              >
                                <Ban size={16} />
                                Cancelar
                              </button>
                            )}
                            {shipment.label_url && (
                              <a
                                href={shipment.label_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] font-semibold text-sm rounded-xl transition-all"
                              >
                                <FileText size={16} />
                                Descargar etiqueta
                              </a>
                            )}
                            {shipment.track_url && (
                              <a
                                href={shipment.track_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] font-semibold text-sm rounded-xl transition-all"
                              >
                                <ExternalLink size={16} />
                                Rastrear
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <div className="flex justify-between text-xs text-[var(--text-light)] border-t border-[var(--border)] pt-4">
        <span>Total: {filteredShipments.length} de {shipments.length} envíos</span>
        <span>Última actualización: {new Date().toLocaleString()}</span>
      </div>
    </motion.div>
  );
}