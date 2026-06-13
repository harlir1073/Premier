import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const TYPES = ['hotel', 'airline', 'transfer', 'cruise', 'other'];
const EMPTY_FORM = { name: '', supplier_type: 'hotel', contact_person: '', email: '', phone: '', currency: 'USD', payment_terms_days: 0, notes: '' };

export default function Suppliers() {
  const { can } = useAuth();
  const [records, setRecords] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  async function load() {
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (search) params.set('search', search);
    setRecords(await api.get(`/suppliers?${params}`));
  }

  useEffect(() => { load(); }, [typeFilter, search]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/suppliers', form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-eyebrow mb-1">Master data</div>
          <h1 className="font-display text-3xl">Suppliers</h1>
        </div>
        {can('suppliers', 'create') && (
          <button onClick={() => setShowForm(s => !s)} className="bg-ink text-white rounded px-4 py-2 text-sm font-medium hover:bg-slate transition-colors">
            {showForm ? 'Cancel' : 'Add new'}
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <input placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)}
          className="border border-slate/20 rounded px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-slate" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-slate/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate">
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-paper border border-slate/10 rounded-lg p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow block mb-1">Name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Type</label>
            <select value={form.supplier_type} onChange={e => setForm({ ...form, supplier_type: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
              {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Contact person</label>
            <input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Currency</label>
            <input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Payment terms (days)</label>
            <input type="number" value={form.payment_terms_days} onChange={e => setForm({ ...form, payment_terms_days: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="label-eyebrow block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" rows={2} />
          </div>

          {error && <div className="text-coral text-sm col-span-2">{error}</div>}

          <div className="col-span-2">
            <button type="submit" className="bg-ink text-white rounded px-4 py-2 text-sm font-medium hover:bg-slate transition-colors">Save</button>
          </div>
        </form>
      )}

      <div className="bg-paper rounded-lg border border-slate/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cloud text-left">
            <tr>
              <th className="px-4 py-3 label-eyebrow">Name</th>
              <th className="px-4 py-3 label-eyebrow">Type</th>
              <th className="px-4 py-3 label-eyebrow">Contact</th>
              <th className="px-4 py-3 label-eyebrow">Currency</th>
              <th className="px-4 py-3 label-eyebrow">Payment terms</th>
              <th className="px-4 py-3 label-eyebrow">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/10">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-cloud/50">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 capitalize">{r.supplier_type}</td>
                <td className="px-4 py-3">{r.contact_person || '—'}</td>
                <td className="px-4 py-3">{r.currency}</td>
                <td className="px-4 py-3">{r.payment_terms_days} days</td>
                <td className="px-4 py-3">
                  <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${
                    r.status === 'active' ? 'bg-slate/10 text-slate' : 'bg-coral/10 text-coral'
                  }`}>{r.status}</span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-mist">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
