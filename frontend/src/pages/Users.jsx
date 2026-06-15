import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { full_name: '', email: '', password: '', role_id: '' };

export default function Users() {
  const { can } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  async function load() {
    setUsers(await api.get('/users'));
    setRoles(await api.get('/users/roles'));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/users', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(user) {
    await api.put(`/users/${user.id}`, { status: user.status === 'active' ? 'inactive' : 'active' });
    load();
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="label-eyebrow mb-1">Administration</div>
          <h1 className="font-display text-3xl">Users</h1>
        </div>
        {can('users', 'create') && (
          <button onClick={() => setShowForm(s => !s)} className="bg-ink text-white rounded px-4 py-2 text-sm font-medium hover:bg-slate transition-colors">
            {showForm ? 'Cancel' : 'Add user'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-paper border border-slate/10 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow block mb-1">Full name</label>
            <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Email</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Password</label>
            <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Role</label>
            <select required value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
              <option value="">— Select role —</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {error && <div className="text-coral text-sm col-span-2">{error}</div>}

          <div className="col-span-2">
            <button type="submit" className="bg-ink text-white rounded px-4 py-2 text-sm font-medium hover:bg-slate transition-colors">Save</button>
          </div>
        </form>
      )}

      <div className="bg-paper rounded-lg border border-slate/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-cloud text-left">
            <tr>
              <th className="px-4 py-3 label-eyebrow">Name</th>
              <th className="px-4 py-3 label-eyebrow">Email</th>
              <th className="px-4 py-3 label-eyebrow">Role</th>
              <th className="px-4 py-3 label-eyebrow">Last login</th>
              <th className="px-4 py-3 label-eyebrow">Status</th>
              <th className="px-4 py-3 label-eyebrow"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/10">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-cloud/50">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role_name}</td>
                <td className="px-4 py-3">{u.last_login ? new Date(u.last_login).toLocaleString() : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${
                    u.status === 'active' ? 'bg-slate/10 text-slate' : 'bg-coral/10 text-coral'
                  }`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {can('users', 'edit') && (
                    <button onClick={() => toggleStatus(u)} className="text-xs text-slate hover:underline">
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
