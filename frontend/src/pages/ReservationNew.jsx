import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const PRODUCT_TYPES = ['hotel', 'flight', 'transfer', 'cruise', 'other'];
const STATUS_OPTIONS = ['pending', 'confirmed', 'voucher issued', 'cancelled'];
const SOURCE_OPTIONS = ['instant', 'manual', 'online', 'phone', 'email'];
const INVENTORY_OPTIONS = ['request', 'freesale', 'allocation'];
const AVAILABILITY_OPTIONS = ['available', 'on request', 'not available'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS', 'BGN'];

const EMPTY_ITEM = {
  product_type: 'hotel',
  supplier_id: '',
  description: '',
  start_date: '',
  end_date: '',
  passenger_name: '',
  city: '',
  service_name: '',
  booking_item_reference: '',
  supplier_ref: '',
  agency_reference: '',
  source: '',
  platform: '',
  inventory_type: '',
  availability: '',
  status: 'pending',
  cancellation_deadline: '',
  hotel_confirmation: '',
  remarks: '',
  agent_profile: '',
  agent_price: '',
  agent_currency: 'USD',
  agent_payment_due_date: '',
  agent_prepayment: '',
  supplier_price: '',
  supplier_currency: 'USD',
  supplier_payment_due_date: '',
  supplier_prepayment: '',
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
          agent_prepayment: it.agent_prepayment || null,
          supplier_prepayment: it.supplier_prepayment || null,
          start_date: it.start_date || null,
          end_date: it.end_date || null,
          agent_payment_due_date: it.agent_payment_due_date || null,
          supplier_payment_due_date: it.supplier_payment_due_date || null,
          cancellation_deadline: it.cancellation_deadline || null,
        }))
      };
      const result = await api.post('/reservations', payload);
      navigate(`/reservations/${result.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl">
      <div>
        <div className="label-eyebrow mb-1">Bookings</div>
        <h1 className="font-display text-3xl">New Reservation</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Reservation Header ── */}
        <div className="bg-paper border border-slate/10 rounded-lg p-5">
          <h2 className="font-display text-lg mb-4 pb-2 border-b border-slate/10">General Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label-eyebrow block mb-1">Agent</label>
              <select value={agentId} onChange={e => setAgentId(e.target.value)}
                className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                <option value="">— None —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-eyebrow block mb-1">Lead Passenger Name</label>
              <input required value={leadPassenger} onChange={e => setLeadPassenger(e.target.value)}
                className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="label-eyebrow block mb-1">Passenger Count</label>
              <input type="number" min={1} value={passengerCount} onChange={e => setPassengerCount(e.target.value)}
                className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label-eyebrow block mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* ── Booking Items ── */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl">Booking Items</h2>
            <button type="button" onClick={addItem}
              className="text-sm bg-ink text-white rounded px-4 py-2 hover:bg-slate transition-colors">
              + Add Booking Item
            </button>
          </div>

          {items.map((item, i) => (
            <div key={i} className="bg-paper border border-slate/10 rounded-lg overflow-hidden">

              {/* Item Header */}
              <div className="bg-coral/10 border-b border-slate/10 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">Booking Item {i + 1}</span>
                  {item.booking_item_reference && (
                    <span className="text-xs text-slate bg-white border border-slate/20 rounded px-2 py-0.5">
                      {item.booking_item_reference}
                    </span>
                  )}
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}
                    className="text-coral text-xs hover:underline">Remove</button>
                )}
              </div>

              <div className="p-5 space-y-5">

                {/* ── Reference & Status ── */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate/60 mb-3">Reference & Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="label-eyebrow block mb-1">Booking Item Ref</label>
                      <input value={item.booking_item_reference} onChange={e => updateItem(i, 'booking_item_reference', e.target.value)}
                        placeholder="e.g. GO30341592-A"
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">Agency Reference</label>
                      <input value={item.agency_reference} onChange={e => updateItem(i, 'agency_reference', e.target.value)}
                        placeholder="e.g. waiting PO"
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">Status</label>
                      <select value={item.status} onChange={e => updateItem(i, 'status', e.target.value)}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">Agent Profile</label>
                      <input value={item.agent_profile} onChange={e => updateItem(i, 'agent_profile', e.target.value)}
                        placeholder="e.g. Net 15%"
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>

                {/* ── General ── */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate/60 mb-3">General</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="label-eyebrow block mb-1">Product Type</label>
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
                    <div>
                      <label className="label-eyebrow block mb-1">Supplier Ref</label>
                      <input value={item.supplier_ref} onChange={e => updateItem(i, 'supplier_ref', e.target.value)}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">Source</label>
                      <select value={item.source} onChange={e => updateItem(i, 'source', e.target.value)}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                        <option value="">— Select —</option>
                        {SOURCE_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">Platform</label>
                      <input value={item.platform} onChange={e => updateItem(i, 'platform', e.target.value)}
                        placeholder="e.g. WASP"
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">Inventory Type</label>
                      <select value={item.inventory_type} onChange={e => updateItem(i, 'inventory_type', e.target.value)}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                        <option value="">— Select —</option>
                        {INVENTORY_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">Availability</label>
                      <select value={item.availability} onChange={e => updateItem(i, 'availability', e.target.value)}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                        <option value="">— Select —</option>
                        {AVAILABILITY_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="label-eyebrow block mb-1">Description</label>
                      <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                        placeholder="e.g. Hilton Sofia, Deluxe Room, 3 nights"
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="label-eyebrow block mb-1">Remarks</label>
                      <textarea value={item.remarks} onChange={e => updateItem(i, 'remarks', e.target.value)} rows={2}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>

                {/* ── Details ── */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate/60 mb-3">Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="label-eyebrow block mb-1">Start Date</label>
                      <input type="date" value={item.start_date} onChange={e => updateItem(i, 'start_date', e.target.value)}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">End Date</label>
                      <input type="date" value={item.end_date} onChange={e => updateItem(i, 'end_date', e.target.value)}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">CXL Deadline</label>
                      <input type="datetime-local" value={item.cancellation_deadline}
                        onChange={e => updateItem(i, 'cancellation_deadline', e.target.value)}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">City</label>
                      <input value={item.city} onChange={e => updateItem(i, 'city', e.target.value)}
                        placeholder="e.g. Sofia"
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">Service Name</label>
                      <input value={item.service_name} onChange={e => updateItem(i, 'service_name', e.target.value)}
                        placeholder="e.g. Transfer"
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label-eyebrow block mb-1">Hotel Confirmation</label>
                      <input value={item.hotel_confirmation} onChange={e => updateItem(i, 'hotel_confirmation', e.target.value)}
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>

                {/* ── Passenger ── */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate/60 mb-3">Passenger</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-eyebrow block mb-1">Passenger Name</label>
                      <input value={item.passenger_name} onChange={e => updateItem(i, 'passenger_name', e.target.value)}
                        placeholder="Full name(s)"
                        className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>

                {/* ── Pricing ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Agent side */}
                  <div className="bg-cloud rounded-lg p-4 space-y-3">
                    <div className="label-eyebrow text-slate">Agent Side</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-mist block mb-1">Price</label>
                        <input type="number" step="0.01" value={item.agent_price}
                          onChange={e => updateItem(i, 'agent_price', e.target.value)}
                          className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-mist block mb-1">Currency</label>
                        <select value={item.agent_currency} onChange={e => updateItem(i, 'agent_currency', e.target.value)}
                          className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-mist block mb-1">Payment Due Date</label>
                        <input type="date" value={item.agent_payment_due_date}
                          onChange={e => updateItem(i, 'agent_payment_due_date', e.target.value)}
                          className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-mist block mb-1">Prepayment</label>
                        <input type="number" step="0.01" value={item.agent_prepayment}
                          onChange={e => updateItem(i, 'agent_prepayment', e.target.value)}
                          className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Supplier side */}
                  <div className="bg-cloud rounded-lg p-4 space-y-3">
                    <div className="label-eyebrow text-coral">Supplier Side</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-mist block mb-1">Cost</label>
                        <input type="number" step="0.01" value={item.supplier_price}
                          onChange={e => updateItem(i, 'supplier_price', e.target.value)}
                          className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-mist block mb-1">Currency</label>
                        <select value={item.supplier_currency} onChange={e => updateItem(i, 'supplier_currency', e.target.value)}
                          className="w-full border border-slate/20 rounded px-3 py-2 text-sm">
                          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-mist block mb-1">Payment Due Date</label>
                        <input type="date" value={item.supplier_payment_due_date}
                          onChange={e => updateItem(i, 'supplier_payment_due_date', e.target.value)}
                          className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-mist block mb-1">Prepayment</label>
                        <input type="number" step="0.01" value={item.supplier_prepayment}
                          onChange={e => updateItem(i, 'supplier_prepayment', e.target.value)}
                          className="w-full border border-slate/20 rounded px-3 py-2 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {error && <div className="text-coral text-sm">{error}</div>}

        <div className="flex gap-3">
          <button type="submit"
            className="bg-ink text-white rounded px-5 py-2.5 text-sm font-medium hover:bg-slate transition-colors">
            Create Reservation
          </button>
          <button type="button" onClick={() => navigate('/reservations')}
            className="border border-slate/20 rounded px-5 py-2.5 text-sm hover:bg-cloud transition-colors">
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
