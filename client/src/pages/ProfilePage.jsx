import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      api.get('/orders'),
    ])
      .then(([profileRes, ordersRes]) => {
        setProfile(profileRes.data.user);
        setOrders(ordersRes.data.orders || []);
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
