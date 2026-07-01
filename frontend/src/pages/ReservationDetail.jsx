import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const PAY_STYLE = {
  unpaid: 'bg-coral/10 text-coral',
  partial: 'bg-amber/10 text-amber',
  paid: 'bg-slate/10 text-slate'
};

const STATUS_STYLE = {
  pending:          'bg-amber/10 text-amber',
  confirmed:        'bg-slate/10 text-slate',
  'voucher issued': 'bg-green-100 text-green-700',
  cancelled:        'bg-coral/10 text-coral',
};

function Field({ label, value, className = '' }) {
  if (!value) return null;
  return (
    <div className={className}>
      <div className="text-xs text-mist uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [reservation, setReservation] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  async function load() {
    const data = await api.get(`/reservations/${id}`);
    setReservation(data);
    // expand all items by default
    const expanded = {};
    (data.items || []).forEach((_, i) => { expanded[i] = true; });
    setExpandedItems(expanded);
  }

  useEffect(() => { load(); }, [id]);

  async function markPaid(item, direction) {
    const today = new Date().toISOString().slice(0, 10);
    await api.post('/payments', {
      reservation_item_id: item.id,
      direction,
      amount: direction === 'incoming' ? item.agent_price : item.supplier_price,
      currency: direction === 'incoming' ? item.agent_currency : item.supplier_currency,
      payment_date: today
    });
    load();
  }

  function toggleItem(i) {
    setExpandedItems(prev => ({ ...prev, [i]: !prev[i] }));
  }

  if (!reservation) return <div className="p-4 sm:p-8 text-mist">Loading…</div>;

  const totalAgent    = reservation.items.reduce((s, i) => s + parseFloat(i.agent_price || 0), 0);
  const totalSupplier = reservation.items.reduce((s, i) => s + parseFloat(i.supplier_price || 0), 0);
  const margin        = totalAgent - totalSupplier;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button onClick={() => navigate('/reservations')}
            className="text-xs text-mist hover:underline mb-1 block">← Back to reservations</button>
          <div className="label-eyebrow mb-1">Reservation</div>
          <h1 className="font-display text-3xl">{reservation.booking_reference}</h1>
        </div>
        <span className={`text-xs uppercase tracking-wide px-3 py-1 rounded self-start ${
          STATUS_STYLE[reservation.status] || 'bg-amber/10 text-amber'
        }`}>
          {reservation.status}
        </span>
      </div>

      {/* ── Main Layout: Left Panel + Right Content ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT PANEL — General Info ── */}
        <div className="lg:w-72 shrink-0 space-y-4">

          {/* Reservation Info */}
          <div className="bg-paper border border-slate/10 rounded-lg p-4 space-y-3">
            <div className="label-eyebrow text-slate border-b border-slate/10 pb-2">Reservation Info</div>
            <Field label="Booking Reference" value={reservation.booking_reference} />
            <Field label="Lead Passenger" value={reservation.lead_passenger_name} />
            <Field label="Passenger Count" value={reservation.passenger_count} />
            <Field label="Created" value={fmtDateTime(reservation.created_at)} />
            {reservation.notes && (
              <div>
                <div className="text-xs text-mist uppercase tracking-wide mb-0.5">Notes</div>
                <div className="text-sm text-slate">{reservation.notes}</div>
              </div>
            )}
          </div>

          {/* Agent Info */}
          {reservation.agent_name && (
            <div className="bg-paper border border-slate/10 rounded-lg p-4 space-y-3">
              <div className="label-eyebrow text-slate border-b border-slate/10 pb-2">Agency Info</div>
              <Field label="Agent" value={reservation.agent_name} />
            </div>
          )}

          {/* Totals */}
          <div className="bg-paper border border-slate/10 rounded-lg p-4 space-y-3">
            <div className="label-eyebrow text-slate border-b border-slate/10 pb-2">Summary</div>
            <div>
              <div className="text-xs text-mist uppercase tracking-wide mb-0.5">Total Agent Price</div>
              <div className="font-display text-lg">{totalAgent.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-mist uppercase tracking-wide mb-0.5">Total Supplier Cost</div>
              <div className="font-display text-lg">{totalSupplier.toLocaleString()}</div>
            </div>
            <div className="border-t border-slate/10 pt-2">
              <div className="text-xs text-mist uppercase tracking-wide mb-0.5">Margin</div>
              <div className={`font-display text-lg ${margin >= 0 ? 'text-slate' : 'text-coral'}`}>
                {margin.toLocaleString()}
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT CONTENT — Booking Items ── */}
        <div className="flex-1 space-y-4">

          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Booking Items</h2>
            {can('reservations', 'edit') && (
              <button onClick={() => navigate(`/reservations/${id}/items/new`)}
                className="text-sm bg-ink text-white rounded px-4 py-2 hover:bg-slate transition-colors">
                + Add Item
              </button>
            )}
          </div>

          {reservation.items.length === 0 && (
            <div className="bg-paper border border-slate/10 rounded-lg p-8 text-center text-mist text-sm">
              No booking items yet.
            </div>
          )}

          {reservation.items.map((item, idx) => (
            <div key={item.id} className="bg-paper border border-slate/10 rounded-lg overflow-hidden">

              {/* Item Header — always visible */}
              <div
                className="bg-coral/5 border-b border-slate/10 px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-coral/10 transition-colors"
                onClick={() => toggleItem(idx)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-sm capitalize">{item.product_type}</span>
                  {item.booking_item_reference && (
                    <span className="text-xs bg-white border border-slate/20 rounded px-2 py-0.5 font-mono">
                      {item.booking_item_reference}
                    </span>
                  )}
                  {item.service_name && (
                    <span className="text-xs text-mist">{item.service_name}</span>
                  )}
                  {item.city && (
                    <span className="text-xs text-mist">📍 {item.city}</span>
                  )}
                  {item.status && (
                    <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${STATUS_STYLE[item.status] || 'bg-amber/10 text-amber'}`}>
                      {item.status}
                    </span>
                  )}
                </div>
                <span className="text-mist text-xs ml-2">{expandedItems[idx] ? '▲' : '▼'}</span>
              </div>

              {expandedItems[idx] && (
                <div className="p-5 space-y-5">

                  {/* ── Reference & Status ── */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate/50 mb-3">Reference & Status</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <Field label="Booking Item Ref"  value={item.booking_item_reference} />
                      <Field label="Supplier Ref"      value={item.supplier_ref} />
                      <Field label="Agency Reference"  value={item.agency_reference} />
                      <Field label="Agent Profile"     value={item.agent_profile} />
                      <Field label="Source"            value={item.source} />
                      <Field label="Platform"          value={item.platform} />
                      <Field label="Inventory Type"    value={item.inventory_type} />
                      <Field label="Availability"      value={item.availability} />
                    </div>
                  </div>

                  {/* ── General ── */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate/50 mb-3">General</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <Field label="Supplier"     value={item.supplier_name} />
                      <Field label="Product Type" value={item.product_type} className="capitalize" />
                      <Field label="Service Name" value={item.service_name} />
                      {item.description && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-mist uppercase tracking-wide mb-0.5">Description</div>
                          <div className="text-sm">{item.description}</div>
                        </div>
                      )}
                      {item.remarks && (
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-mist uppercase tracking-wide mb-0.5">Remarks</div>
                          <div className="text-sm text-slate">{item.remarks}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Details ── */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate/50 mb-3">Details</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <Field label="Start Date"  value={fmt(item.start_date)} />
                      <Field label="End Date"    value={fmt(item.end_date)} />
                      <Field label="CXL Deadline" value={fmtDateTime(item.cancellation_deadline)} />
                      <Field label="City"        value={item.city} />
                      {item.end_date && item.start_date && (
                        <div>
                          <div className="text-xs text-mist uppercase tracking-wide mb-0.5">Days/Nights</div>
                          <div className="text-sm">
                            {Math.round((new Date(item.end_date) - new Date(item.start_date)) / (1000 * 60 * 60 * 24))}
                          </div>
                        </div>
                      )}
                      <Field label="Hotel Confirmation" value={item.hotel_confirmation} />
                    </div>
                  </div>

                  {/* ── Passenger ── */}
                  {item.passenger_name && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate/50 mb-3">Names</div>
                      <div className="border border-slate/10 rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-cloud">
                            <tr>
                              <th className="text-left px-4 py-2 text-xs text-mist font-medium">Item No.</th>
                              <th className="text-left px-4 py-2 text-xs text-mist font-medium">Passenger Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-slate/10">
                              <td className="px-4 py-2">{idx + 1}</td>
                              <td className="px-4 py-2">{item.passenger_name}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── Pricing ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Agent side */}
                    <div className="bg-cloud rounded-lg p-4 space-y-2">
                      <div className="label-eyebrow text-slate">Agent Side</div>
                      <div className="font-display text-xl">
                        {item.agent_currency} {parseFloat(item.agent_price || 0).toLocaleString()}
                      </div>
                      {item.agent_prepayment && (
                        <div className="text-xs text-mist">Prepayment: {item.agent_currency} {parseFloat(item.agent_prepayment).toLocaleString()}</div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${PAY_STYLE[item.agent_payment_status] || ''}`}>
                          {item.agent_payment_status}
                        </span>
                        {item.agent_payment_status !== 'paid' && can('payments', 'create') && (
                          <button onClick={() => markPaid(item, 'incoming')}
                            className="text-xs text-slate hover:underline">Mark received</button>
                        )}
                      </div>
                      {item.agent_payment_due_date && (
                        <div className="text-xs text-mist">Due {fmt(item.agent_payment_due_date)}</div>
                      )}
                    </div>

                    {/* Supplier side */}
                    <div className="bg-cloud rounded-lg p-4 space-y-2">
                      <div className="label-eyebrow text-coral">Supplier Side</div>
                      <div className="font-display text-xl">
                        {item.supplier_currency} {parseFloat(item.supplier_price || 0).toLocaleString()}
                      </div>
                      {item.supplier_prepayment && (
                        <div className="text-xs text-mist">Prepayment: {item.supplier_currency} {parseFloat(item.supplier_prepayment).toLocaleString()}</div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${PAY_STYLE[item.supplier_payment_status] || ''}`}>
                          {item.supplier_payment_status}
                        </span>
                        {item.supplier_payment_status !== 'paid' && can('payments', 'create') && (
                          <button onClick={() => markPaid(item, 'outgoing')}
                            className="text-xs text-slate hover:underline">Mark paid</button>
                        )}
                      </div>
                      {item.supplier_payment_due_date && (
                        <div className="text-xs text-mist">Due {fmt(item.supplier_payment_due_date)}</div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
