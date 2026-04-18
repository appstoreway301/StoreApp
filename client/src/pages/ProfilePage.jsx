import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const COUNTRIES = [
  { code: 'MX', name: 'Mexico' },
  { code: 'US', name: 'United States' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ES', name: 'Spain' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
];

const emptyAddress = {
  label: 'Home',
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'MX',
  phone: '',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Change password
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Change email
  const [showEmail, setShowEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emError, setEmError] = useState('');
  const [emSuccess, setEmSuccess] = useState('');
  const [emLoading, setEmLoading] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addrError, setAddrError] = useState('');
  const [addrLoading, setAddrLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

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

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword !== confirmNew) {
      setPwError('New passwords do not match');
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
      setPwError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmError('');
    setEmSuccess('');

    setEmLoading(true);
    try {
      const { data } = await api.put('/auth/change-email', { newEmail, password: emailPassword });
      setEmSuccess(data.message);
      setProfile(prev => ({ ...prev, email: data.email }));
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.email = data.email;
      localStorage.setItem('user', JSON.stringify(stored));
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setEmError(err.response?.data?.error || 'Failed to change email');
    } finally {
      setEmLoading(false);
    }
  }

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
      window.location.reload();
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
      window.location.reload();
    } catch {}
  }

  function openAddressForm(addr = null) {
    if (addr) {
      setEditingAddress(addr.id);
      setAddressForm({
        label: addr.label || 'Home',
        name: addr.name,
        address: addr.address,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country,
        phone: addr.phone || '',
      });
    } else {
      setEditingAddress(null);
      setAddressForm(emptyAddress);
    }
    setAddrError('');
    setShowAddressForm(true);
  }

  function closeAddressForm() {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setAddrError('');
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
    setAddrLoading(true);
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress}`, addressForm);
      } else {
        await api.post('/addresses', addressForm);
      }
      const { data } = await api.get('/addresses');
      setAddresses(data.addresses || []);
      closeAddressForm();
    } catch (err) {
      setAddrError(err.response?.data?.error || 'Failed to save address');
    } finally {
      setAddrLoading(false);
    }
  }

  async function handleDeleteAddress(id) {
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

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="alert alert-error">Failed to load profile</div>;

  const paidOrders = orders.filter(o => o.status === 'paid');
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.total_cents, 0);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <div className="profile-card">
        <div className="profile-avatar-wrap" onClick={() => avatarInputRef.current?.click()}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="profile-avatar-overlay">
            {avatarUploading ? '...' : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
        </div>
        <div className="profile-info">
          <h2>{profile.name}</h2>
          <p className="profile-role">{profile.role === 'admin' ? 'Administrator' : 'Customer'}</p>
          {profile.avatar_url && (
            <button className="btn btn-sm btn-danger" onClick={handleRemoveAvatar} style={{ marginTop: '0.5rem' }}>
              Remove photo
            </button>
          )}
        </div>
      </div>

      <div className="profile-details">
        <div className="profile-detail-row">
          <span className="profile-label">Email</span>
          <span className="profile-value">{profile.email}</span>
        </div>
        <div className="profile-detail-row">
          <span className="profile-label">Name</span>
          <span className="profile-value">{profile.name}</span>
        </div>
        <div className="profile-detail-row">
          <span className="profile-label">Email Verified</span>
          <span className="profile-value">
            {profile.email_verified ? (
              <span className="status-badge badge-active">Verified</span>
            ) : (
              <span className="status-badge badge-inactive">Not Verified</span>
            )}
          </span>
        </div>
        <div className="profile-detail-row">
          <span className="profile-label">Member Since</span>
          <span className="profile-value">{formatDate(profile.created_at)}</span>
        </div>
      </div>

      {/* Account Settings */}
      <h2>Account Settings</h2>
      <div className="profile-settings">

        {/* Change Email */}
        <div className="setting-section">
          <div className="setting-header" onClick={() => { setShowEmail(!showEmail); setShowPassword(false); }}>
            <span className="setting-title">Change Email</span>
            <span className="setting-toggle">{showEmail ? '−' : '+'}</span>
          </div>
          {showEmail && (
            <form onSubmit={handleChangeEmail} className="setting-form">
              {emError && <div className="alert alert-error">{emError}</div>}
              {emSuccess && <div className="alert alert-success">{emSuccess}</div>}
              <label>New Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
              <label>Confirm Password</label>
              <input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} required />
              <button type="submit" className="btn btn-primary" disabled={emLoading}>
                {emLoading ? 'Saving...' : 'Change Email'}
              </button>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div className="setting-section">
          <div className="setting-header" onClick={() => { setShowPassword(!showPassword); setShowEmail(false); }}>
            <span className="setting-title">Change Password</span>
            <span className="setting-toggle">{showPassword ? '−' : '+'}</span>
          </div>
          {showPassword && (
            <form onSubmit={handleChangePassword} className="setting-form">
              {pwError && <div className="alert alert-error">{pwError}</div>}
              {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
              <label>Current Password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              <label>New Password (min. 8 characters)</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
              <label>Confirm New Password</label>
              <input type="password" value={confirmNew} onChange={e => setConfirmNew(e.target.value)} required />
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? 'Saving...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Shipping Addresses */}
      <h2>Shipping Addresses</h2>
      <div className="addresses-section">
        {addresses.length === 0 && !showAddressForm && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No saved addresses yet.</p>
        )}

        {!showAddressForm && (
          <div className="address-cards">
            {addresses.map(addr => (
              <div key={addr.id} className={`address-card${addr.is_default ? ' address-default' : ''}`}>
                <div className="address-card-header">
                  <span className="address-label">{addr.label}</span>
                  {addr.is_default && <span className="status-badge badge-active">Default</span>}
                </div>
                <div className="address-card-body">
                  <strong>{addr.name}</strong><br />
                  {addr.address}<br />
                  {addr.city}, {addr.state} {addr.zip}<br />
                  {COUNTRIES.find(c => c.code === addr.country)?.name || addr.country}
                  {addr.phone && <><br />{addr.phone}</>}
                </div>
                <div className="address-card-actions">
                  {!addr.is_default && (
                    <button className="btn btn-sm" onClick={() => handleSetDefault(addr.id)}>Set Default</button>
                  )}
                  <button className="btn btn-sm" onClick={() => openAddressForm(addr)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteAddress(addr.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddressForm ? (
          <form onSubmit={handleSaveAddress} className="shipping-form" style={{ marginTop: 0 }}>
            <h3>{editingAddress ? 'Edit Address' : 'New Address'}</h3>
            {addrError && <div className="alert alert-error">{addrError}</div>}
            <div className="shipping-grid">
              <div className="form-group">
                <label>Label *</label>
                <select
                  value={addressForm.label}
                  onChange={e => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                  required
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  value={addressForm.name}
                  onChange={e => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  value={addressForm.phone}
                  onChange={e => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                  type="tel"
                />
              </div>
              <div className="form-group">
                <label>Country *</label>
                <select
                  value={addressForm.country}
                  onChange={e => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                  required
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ZIP / Postal Code * {zipLoading && '(searching...)'}</label>
                <input
                  value={addressForm.zip}
                  onChange={e => setAddressForm(prev => ({ ...prev, zip: e.target.value }))}
                  onBlur={handleAddressZipBlur}
                  required
                  placeholder="Enter ZIP to auto-fill"
                />
              </div>
              <div className="form-group">
                <label>State / Province *</label>
                <input
                  value={addressForm.state}
                  onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input
                  value={addressForm.city}
                  onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>Address *</label>
                <input
                  value={addressForm.address}
                  onChange={e => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
                  required
                  placeholder="Street, number, apartment..."
                />
              </div>
            </div>
            <div className="cart-actions">
              <button type="button" className="btn" onClick={closeAddressForm}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={addrLoading}>
                {addrLoading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        ) : addresses.length < 3 && (
          <button className="btn btn-primary" onClick={() => openAddressForm()} style={{ marginTop: '0.75rem' }}>
            + Add Address
          </button>
        )}
      </div>

      <h2>Purchase Summary</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{paidOrders.length}</span>
          <span className="stat-label">Orders Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">${(totalSpent / 100).toFixed(2)}</span>
          <span className="stat-label">Total Spent</span>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Link to="/orders" className="btn btn-primary">View Order History</Link>
      </div>
    </div>
  );
}
