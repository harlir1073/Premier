import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE = {
  pending: 'bg-amber/10 text-amber',
  confirmed: 'bg-slate/10 text-slate',
  cancelled: 'bg-coral/10 text-coral'
};

export default function Reservations() {
  const { can } = useAuth();
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    api.get(`/reservations?${params}`).then(setRecords);
  }, [status]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-eyebrow mb-1">Bookings</div>
          <h1 className="font-display text-3xl">Reservations</h1>
        </div>
        {can('reservations', 'create') && (
          <Link to="/reservations/new" className="bg-ink text-white rounded px-4 py-2 text-sm font-medium hover:bg-slate transition-colors">
            New reservation
          </Link>
        )}
      </div>

      <select value={status} onChange={e => setStatus(e.target.value)}
        className="border border-slate/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <div className="bg-paper rounded-lg border border-slate/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cloud text-left">
            <tr>
              <th className="px-4 py-3 label-eyebrow">Reference</th>
              <th className="px-4 py-3 label-eyebrow">Passenger</th>
              <th className="px-4 py-3 label-eyebrow">Agent</th>
              <th className="px-4 py-3 label-eyebrow">Created</th>
              <th className="px-4 py-3 label-eyebrow">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/10">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-cloud/50 cursor-pointer" onClick={() => window.location.href = `/reservations/${r.id}`}>
                <td className="px-4 py-3 font-medium">
                  <Link to={`/reservations/${r.id}`} className="text-slate hover:underline">{r.booking_reference}</Link>
                </td>
                <td className="px-4 py-3">{r.lead_passenger_name}</td>
                <td className="px-4 py-3">{r.agent_name || '—'}</td>
                <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${STATUS_STYLE[r.status] || ''}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-mist">No reservations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
