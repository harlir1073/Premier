import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const PRODUCT_TYPES = ['hotel', 'flight', 'transfer', 'cruise', 'other'];
const EMPTY_ITEM = {
  product_type: 'hotel', supplier_id: '', description: '', start_date: '', end_date: '',
  agent_price: '', agent_currency: 'USD', agent_payment_due_date: '',
  supplier_price: '', supplier_currency: 'USD', supplier_payment_due_date: ''
};

export default function ReservationNew() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [agentId, setAgentId] = useState('');
  const [leadPassenger, setLeadPassenger] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/clients-agents?type=agent').then(setAgents).catch(() => {});
    api.get('/suppliers').then(setSuppliers).catch(() => {});
  }, []);

  function updateItem(index, field, value) {
    setItems(items.map((it, i) => i === index ? { ...it, [field]: value } : it));
  }

  function addItem() {
    setItems([...items, { ...EMPTY_ITEM }]);
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        agent_id: agentId || null,
        lead_passenger_name: leadPassenger,
        passenger_count: passengerCount,
        notes,
        items: items.map(it => ({
          ...it,
          supplier_id: it.supplier_id || null,
          agent_price: it.agent_price || 0,
          supplier_price: it.supplier_price || 0,
          start_date: it.start_date || null,
          end_date: it.end_date || null,
          agent_payment_due_date: it.agent_payment_due_date || null,
          supplier_payment_due_date: it.supplier_payment_due_date || null
        }))
      };
      const result = await api.post('/reservations', payload);
      navigate(`/reservations/${result.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <div className="label-eyebrow mb-1">Bookings</div>
        <h1 className="font-display text-3xl">New reservation</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-paper border border-slate/10 rounded-lg p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow block mb-1">Agent</label>
            <select value={agentId} onChange={e => setAgentId(e.target.value)}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
              <option value="">— None —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Lead passenger name</label>
            <input required value={leadPassenger} onChange={e => setLeadPassenger(e.target.value)}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-eyebrow block mb-1">Passenger count</label>
            <input type="number" min={1} value={passengerCount} onChange={e => setPassengerCount(e.target.value)}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="label-eyebrow block mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Products</h2>
            <button type="button" onClick={addItem} className="text-sm text-slate hover:underline">+ Add product line</button>
          </div>

          {items.map((item, i) => (
            <div key={i} className="bg-paper border border-slate/10 rounded-lg p-5 grid grid-cols-4 gap-4 relative">
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)}
                  className="absolute top-3 right-3 text-coral text-xs hover:underline">Remove</button>
              )}
              <div>
                <label className="label-eyebrow block mb-1">Product type</label>
                <select value={item.product_type} onChange={e => updateItem(i, 'product_type', e.target.value)}
                  className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                  {PRODUCT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label-eyebrow block mb-1">Supplier</label>
                <select value={item.supplier_id} onChange={e => updateItem(i, 'supplier_id', e.target.value)}
                  className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                  <option value="">— None —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label-eyebrow block mb-1">Description</label>
                <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                  placeholder="e.g. Hilton Cairo, Deluxe Room, 3 nights"
                  className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="label-eyebrow block mb-1">Start date</label>
                <input type="date" value={item.start_date} onChange={e => updateItem(i, 'start_date', e.target.value)}
                  className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="label-eyebrow block mb-1">End date</label>
                <input type="date" value={item.end_date} onChange={e => updateItem(i, 'end_date', e.target.value)}
                  className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
              </div>
              <div></div>
              <div></div>

              <div className="col-span-2 grid grid-cols-2 gap-2 bg-cloud rounded p-3">
                <div className="col-span-2 label-eyebrow text-slate">Agent side</div>
                <div>
                  <label className="text-xs text-mist block mb-1">Price</label>
                  <input type="number" step="0.01" value={item.agent_price} onChange={e => updateItem(i, 'agent_price', e.target.value)}
                    className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-mist block mb-1">Payment due date</label>
                  <input type="date" value={item.agent_payment_due_date} onChange={e => updateItem(i, 'agent_payment_due_date', e.target.value)}
                    className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-2 bg-cloud rounded p-3">
                <div className="col-span-2 label-eyebrow text-coral">Supplier side</div>
                <div>
                  <label className="text-xs text-mist block mb-1">Cost</label>
                  <input type="number" step="0.01" value={item.supplier_price} onChange={e => updateItem(i, 'supplier_price', e.target.value)}
                    className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-mist block mb-1">Payment due date</label>
                  <input type="date" value={item.supplier_payment_due_date} onChange={e => updateItem(i, 'supplier_payment_due_date', e.target.value)}
                    className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="text-coral text-sm">{error}</div>}

        <button type="submit" className="bg-ink text-white rounded px-5 py-2.5 text-sm font-medium hover:bg-slate transition-colors">
          Create reservation
        </button>
      </form>
    </div>
  );
}
