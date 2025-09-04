import React, { useState, useEffect, useCallback } from 'react';

// Centralized API base
const API_BASE = 'https://cbt-rew7.onrender.com';

// Helper: safe fetch JSON
async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json().catch(() => ({}));
}

export default function MultiTenantAdmin() {
  // Institutions
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected institution
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  // Modals (refactored)
  const [showManageAdminsForm, setShowManageAdminsForm] = useState(false);
  const [showViewAdmins, setShowViewAdmins] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);

  // Admins state
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Forms
  const [passwordResetData, setPasswordResetData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [addAdminData, setAddAdminData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  });

  // Load institutions
  const loadInstitutions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const raw = await fetchJson(`${API_BASE}/api/tenants`);
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.tenants) ? raw.tenants : []);
      const normalized = list.map((t) => {
        const defaultAdmin = t.default_admin || (Array.isArray(t.admins) ? t.admins.find(a => a.is_default_admin) : null) || {};
        const totalUsers = (
          t.totalUsers ??
          t.userCount ??
          (Array.isArray(t.users) ? t.users.length : undefined) ??
          (Array.isArray(t.admins) ? t.admins.length : undefined) ??
          (t.stats && typeof t.stats.totalUsers === 'number' ? t.stats.totalUsers : undefined) ??
          0
        );
        return {
          ...t,
          _id: t._id || t.id,
          subscriptionPlan: t.subscriptionPlan || t.plan || 'Basic',
          createdAt: t.createdAt || t.created_at || t.createdOn,
          primaryAdmin: t.primaryAdmin || defaultAdmin.fullName || defaultAdmin.name || '',
          adminUsername: t.adminUsername || defaultAdmin.username || '',
          adminEmail: t.adminEmail || defaultAdmin.email || '',
          totalUsers
        };
      });
      setInstitutions(normalized);
    } catch (e) {
      setError(e.message || 'Failed to load institutions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  // Load admins for institution
  const loadAdmins = useCallback(async (tenantSlug) => {
    if (!tenantSlug) return;
    try {
      setLoadingAdmins(true);
      const data = await fetchJson(`${API_BASE}/api/tenants/${tenantSlug}/admins`);
      const list = Array.isArray(data) ? data : (Array.isArray(data?.admins) ? data.admins : []);
      setAdmins(list);
    } catch (e) {
      setError(e.message || 'Failed to load admins');
      setAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  // UI Actions
  const handleOpenManage = (institution) => {
    setSelectedInstitution(institution);
    setShowManageAdminsForm(true);
    loadAdmins(institution.slug || institution._id);
  };

  const handleCloseManage = () => {
    setShowManageAdminsForm(false);
    setSelectedInstitution(null);
  };

  const handleOpenViewAdmins = () => {
    setShowViewAdmins(true);
  };

  const handleCloseViewAdmins = () => {
    setShowViewAdmins(false);
  };

  const handleOpenReset = () => {
    setShowPasswordReset(true);
  };

  const handleCloseReset = () => {
    setShowPasswordReset(false);
    setPasswordResetData({ newPassword: '', confirmPassword: '' });
  };

  const handleOpenAddAdmin = () => {
    setShowAddAdminForm(true);
  };

  const handleCloseAddAdmin = () => {
    setShowAddAdminForm(false);
    setAddAdminData({ username: '', email: '', fullName: '', password: '', confirmPassword: '', role: 'admin' });
  };

  // Admin operations
  const setDefaultAdmin = async (adminId) => {
    if (!selectedInstitution || !adminId) return;
    try {
      await fetchJson(`${API_BASE}/api/tenants/${selectedInstitution.slug || selectedInstitution._id}/admins/${adminId}/default`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makeDefault: true })
      });
      // Promote to super_admin per requirement
      await fetchJson(`${API_BASE}/api/tenants/${selectedInstitution.slug || selectedInstitution._id}/admins/${adminId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'super_admin' })
      });
      await loadAdmins(selectedInstitution.slug || selectedInstitution._id);
      await loadInstitutions();
    } catch (e) {
      setError(e.message || 'Failed to set default admin');
    }
  };

  const updateAdminRole = async (adminId, role) => {
    if (!selectedInstitution || !adminId) return;
    try {
      await fetchJson(`${API_BASE}/api/tenants/${selectedInstitution.slug || selectedInstitution._id}/admins/${adminId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      await loadAdmins(selectedInstitution.slug || selectedInstitution._id);
    } catch (e) {
      setError(e.message || 'Failed to update admin role');
    }
  };

  const handlePasswordResetChange = (e) => {
    const { name, value } = e.target;
    setPasswordResetData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!selectedInstitution) return;
    if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await fetchJson(`${API_BASE}/api/tenants/${selectedInstitution.slug || selectedInstitution._id}/admins/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedInstitution.adminUsername || '',
          newPassword: passwordResetData.newPassword
        })
      });
      handleCloseReset();
    } catch (e) {
      setError(e.message || 'Failed to reset admin password');
    }
  };

  const handleAddAdminChange = (e) => {
    const { name, value } = e.target;
    setAddAdminData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!selectedInstitution) return;
    if (addAdminData.password !== addAdminData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await fetchJson(`${API_BASE}/api/tenants/${selectedInstitution.slug || selectedInstitution._id}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: addAdminData.username,
          email: addAdminData.email,
          fullName: addAdminData.fullName,
          password: addAdminData.password,
          role: addAdminData.role
        })
      });
      await loadAdmins(selectedInstitution.slug || selectedInstitution._id);
      handleCloseAddAdmin();
    } catch (e) {
      setError(e.message || 'Failed to add admin');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Multi-tenant Admin</h2>
        {error ? (
          <p className="text-red-600 mt-2">{error}</p>
        ) : null}
      </div>

      {/* Institutions List */}
      <div className="space-y-3">
        {loading ? (
          <p>Loading institutions...</p>
        ) : (
          institutions.map((inst) => (
            <div key={inst._id || inst.slug} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{inst.name}</div>
                <div className="text-sm text-gray-600">Users: {inst.totalUsers || 0}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={() => handleOpenManage(inst)}>
                  Manage Admins
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manage Admins Modal (3 buttons only) */}
      {showManageAdminsForm && selectedInstitution && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white rounded shadow w-11/12 md:w-2/3 lg:w-1/2 mt-16 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manage Admins - {selectedInstitution.name}</h3>
              <button className="text-gray-500" onClick={handleCloseManage}>✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button className="px-4 py-3 rounded bg-blue-600 text-white" onClick={handleOpenViewAdmins}>View Admins</button>
              <button className="px-4 py-3 rounded bg-amber-600 text-white" onClick={handleOpenReset}>Reset Admin Password</button>
              <button className="px-4 py-3 rounded bg-green-600 text-white" onClick={handleOpenAddAdmin}>Add New Admin</button>
            </div>
          </div>
        </div>
      )}

      {/* View Admins Modal (list, roles, set default) */}
      {showViewAdmins && selectedInstitution && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white rounded shadow w-11/12 md:w-3/4 lg:w-1/2 mt-16 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Admins - {selectedInstitution.name}</h3>
              <button className="text-gray-500" onClick={handleCloseViewAdmins}>✕</button>
            </div>

            {loadingAdmins ? (
              <p>Loading admins...</p>
            ) : admins.length === 0 ? (
              <p className="text-gray-600">No admins yet.</p>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin._id || admin.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="font-medium">{admin.fullName || admin.name || admin.username}</div>
                      <div className="text-sm text-gray-600">{admin.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        className="border rounded px-2 py-1"
                        value={admin.role || 'admin'}
                        onChange={(e) => updateAdminRole(admin._id || admin.id, e.target.value)}
                      >
                        <option value="admin">admin</option>
                        <option value="tenant_admin">tenant_admin</option>
                        <option value="managed_admin">managed_admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                      <button
                        className="px-3 py-1 rounded bg-indigo-600 text-white"
                        onClick={() => setDefaultAdmin(admin._id || admin.id)}
                      >
                        Set Default
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && selectedInstitution && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white rounded shadow w-11/12 md:w-2/3 lg:w-1/2 mt-16 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reset Admin Password - {selectedInstitution.name}</h3>
              <button className="text-gray-500" onClick={handleCloseReset}>✕</button>
            </div>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordResetData.newPassword}
                  onChange={handlePasswordResetChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordResetData.confirmPassword}
                  onChange={handlePasswordResetChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-3 py-2 rounded border" onClick={handleCloseReset}>Cancel</button>
                <button type="submit" className="px-3 py-2 rounded bg-amber-600 text-white">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Admin Modal */}
      {showAddAdminForm && selectedInstitution && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white rounded shadow w-11/12 md:w-2/3 lg:w-1/2 mt-16 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Admin - {selectedInstitution.name}</h3>
              <button className="text-gray-500" onClick={handleCloseAddAdmin}>✕</button>
            </div>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={addAdminData.fullName}
                    onChange={handleAddAdminChange}
                    required
                    className="mt-1 block w-full border rounded px-3 py-2"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={addAdminData.username}
                    onChange={handleAddAdminChange}
                    required
                    className="mt-1 block w-full border rounded px-3 py-2"
                    placeholder="e.g. johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={addAdminData.email}
                    onChange={handleAddAdminChange}
                    required
                    className="mt-1 block w-full border rounded px-3 py-2"
                    placeholder="e.g. john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select name="role" value={addAdminData.role} onChange={handleAddAdminChange} className="mt-1 block w-full border rounded px-3 py-2">
                    <option value="admin">admin</option>
                    <option value="tenant_admin">tenant_admin</option>
                    <option value="managed_admin">managed_admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={addAdminData.password}
                    onChange={handleAddAdminChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="mt-1 block w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={addAdminData.confirmPassword}
                    onChange={handleAddAdminChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="mt-1 block w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-3 py-2 rounded border" onClick={handleCloseAddAdmin}>Cancel</button>
                <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white">Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
