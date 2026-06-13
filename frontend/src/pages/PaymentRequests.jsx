import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE = {
  draft: 'bg-mist/10 text-mist',
  sent: 'bg-amber/10 text-amber',
  paid: 'bg-slate/10 text-slate',
  cancelled: 'bg-coral/10 text-coral'
};

export default function PaymentRequests() {
  const { can } = useAuth();
  const [requests, setRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState('');
  const [unpaidItems, setUnpaidItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);

  async function load() {
    setRequests(await api.get('/payment-requests'));
  }

  useEffect(() => {
    load();
    api.get('/clients-agents?type=agent').then(setAgents).catch(() => {});
  }, []);

  useEffect(() => {
    if (!agentId) { setUnpaidItems([]); return; }
    api.get('/reports/outstanding-agent-payments').then(rows => {
      // outstanding-agent-payments doesn't filter by agent server-side; filter client-side
      setUnpaidItems(rows.filter(r => r.agent_name === agents.find(a => String(a.id) === agentId)?.name));
    });
  }, [agentId, agents]);

  function toggleItem(itemId) {
    setSelected(sel => sel.includes(itemId) ? sel.filter(i => i !== itemId) : [...sel, itemId]);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/payment-requests', { agent_id: agentId, due_date: dueDate || null, reservation_item_ids: selected });
      setSelected([]);
      setAgentId('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(id, status) {
    await api.put(`/payment-requests/${id}/status`, { status });
    load();
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <div className="label-eyebrow mb-1">Billing</div>
        <h1 className="font-display text-3xl">Payment Requests</h1>
        <p className="text-sm text-mist mt-1">Requests for payment sent to clients / agents for unpaid bookings.</p>
      </div>

      {can('payment_requests', 'create') && (
        <form onSubmit={handleCreate} className="bg-paper border border-slate/10 rounded-lg p-5 space-y-4">
          <h2 className="font-display text-lg">Create new request</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-eyebrow block mb-1">Agent</label>
              <select required value={agentId} onChange={e => { setAgentId(e.target.value); setSelected([]); }}
                className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                <option value="">— Select agent —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-eyebrow block mb-1">Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
            </div>
          </div>

          {agentId && (
            <div>
              <div className="label-eyebrow mb-2">Unpaid items for this agent</div>
              {unpaidItems.length === 0 && <div className="text-sm text-mist">No unpaid items for this agent.</div>}
              <div className="space-y-1">
                {unpaidItems.map(item => (
                  <label key={item.item_id} className="flex items-center justify-between text-sm bg-cloud rounded px-3 py-2 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={selected.includes(item.item_id)} onChange={() => toggleItem(item.item_id)} />
                      {item.booking_reference} — {item.description || item.product_type}
                    </span>
                    <span className="font-medium">{item.agent_currency} {parseFloat(item.agent_price).toLocaleString()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <div className="text-coral text-sm">{error}</div>}

          <button type="submit" disabled={selected.length === 0}
            className="bg-ink text-white rounded px-4 py-2 text-sm font-medium hover:bg-slate transition-colors disabled:opacity-40">
            Generate payment request
          </button>
        </form>
      )}

      <div className="bg-paper rounded-lg border border-slate/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cloud text-left">
            <tr>
              <th className="px-4 py-3 label-eyebrow">Request #</th>
              <th className="px-4 py-3 label-eyebrow">Agent</th>
              <th className="px-4 py-3 label-eyebrow">Amount</th>
              <th className="px-4 py-3 label-eyebrow">Due date</th>
              <th className="px-4 py-3 label-eyebrow">Status</th>
              <th className="px-4 py-3 label-eyebrow"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate/10">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-cloud/50">
                <td className="px-4 py-3 font-medium">{r.request_number}</td>
                <td className="px-4 py-3">{r.agent_name}</td>
                <td className="px-4 py-3">{r.currency} {parseFloat(r.total_amount).toLocaleString()}</td>
                <td className="px-4 py-3">{r.due_date ? new Date(r.due_date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {can('payment_requests', 'approve') && r.status === 'draft' && (
                    <button onClick={() => updateStatus(r.id, 'sent')} className="text-xs text-slate hover:underline">Mark sent</button>
                  )}
                  {can('payment_requests', 'approve') && r.status === 'sent' && (
                    <button onClick={() => updateStatus(r.id, 'paid')} className="text-xs text-slate hover:underline">Mark paid</button>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-mist">No payment requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
