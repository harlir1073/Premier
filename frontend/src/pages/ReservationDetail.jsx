import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const PAY_STYLE = {
  unpaid: 'bg-coral/10 text-coral',
  partial: 'bg-amber/10 text-amber',
  paid: 'bg-slate/10 text-slate'
};

export default function ReservationDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const [reservation, setReservation] = useState(null);

  async function load() {
    setReservation(await api.get(`/reservations/${id}`));
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

  if (!reservation) return <div className="p-4 sm:p-8 text-mist">Loading…</div>;

  const totalAgent = reservation.items.reduce((s, i) => s + parseFloat(i.agent_price), 0);
  const totalSupplier = reservation.items.reduce((s, i) => s + parseFloat(i.supplier_price), 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="label-eyebrow mb-1">Reservation</div>
          <h1 className="font-display text-3xl">{reservation.booking_reference}</h1>
        </div>
        <span className={`text-xs uppercase tracking-wide px-3 py-1 rounded ${
          reservation.status === 'confirmed' ? 'bg-slate/10 text-slate' :
          reservation.status === 'cancelled' ? 'bg-coral/10 text-coral' : 'bg-amber/10 text-amber'
        }`}>
          {reservation.status}
        </span>
      </div>

      <div className="bg-paper border border-slate/10 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="label-eyebrow mb-1">Lead passenger</div>
          <div>{reservation.lead_passenger_name}</div>
        </div>
        <div>
          <div className="label-eyebrow mb-1">Agent</div>
          <div>{reservation.agent_name || '—'}</div>
        </div>
        <div>
          <div className="label-eyebrow mb-1">Passengers</div>
          <div>{reservation.passenger_count}</div>
        </div>
        {reservation.notes && (
          <div className="col-span-3">
            <div className="label-eyebrow mb-1">Notes</div>
            <div>{reservation.notes}</div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl">Products</h2>
        {reservation.items.map(item => (
          <div key={item.id} className="bg-paper border border-slate/10 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="col-span-3 flex items-center justify-between">
              <div>
                <span className="font-medium capitalize">{item.product_type}</span>
                {item.description && <span className="text-mist"> — {item.description}</span>}
              </div>
              {item.supplier_name && <span className="text-mist text-xs">{item.supplier_name}</span>}
            </div>

            <div>
              <div className="label-eyebrow mb-1">Dates</div>
              <div>{item.start_date ? new Date(item.start_date).toLocaleDateString() : '—'}
                {item.end_date && ` – ${new Date(item.end_date).toLocaleDateString()}`}</div>
            </div>

            <div className="bg-cloud rounded p-3">
              <div className="label-eyebrow text-slate mb-1">Agent price</div>
              <div className="font-display text-lg">{item.agent_currency} {parseFloat(item.agent_price).toLocaleString()}</div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${PAY_STYLE[item.agent_payment_status]}`}>
                  {item.agent_payment_status}
                </span>
                {item.agent_payment_status !== 'paid' && can('payments', 'create') && (
                  <button onClick={() => markPaid(item, 'incoming')} className="text-xs text-slate hover:underline">Mark received</button>
                )}
              </div>
              {item.agent_payment_due_date && (
                <div className="text-xs text-mist mt-1">Due {new Date(item.agent_payment_due_date).toLocaleDateString()}</div>
              )}
            </div>

            <div className="bg-cloud rounded p-3">
              <div className="label-eyebrow text-coral mb-1">Supplier cost</div>
              <div className="font-display text-lg">{item.supplier_currency} {parseFloat(item.supplier_price).toLocaleString()}</div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${PAY_STYLE[item.supplier_payment_status]}`}>
                  {item.supplier_payment_status}
                </span>
                {item.supplier_payment_status !== 'paid' && can('payments', 'create') && (
                  <button onClick={() => markPaid(item, 'outgoing')} className="text-xs text-slate hover:underline">Mark paid</button>
                )}
              </div>
              {item.supplier_payment_due_date && (
                <div className="text-xs text-mist mt-1">Due {new Date(item.supplier_payment_due_date).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-paper border border-slate/10 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="label-eyebrow mb-1">Total agent price</div>
          <div className="font-display text-xl">{totalAgent.toLocaleString()}</div>
        </div>
        <div>
          <div className="label-eyebrow mb-1">Total supplier cost</div>
          <div className="font-display text-xl">{totalSupplier.toLocaleString()}</div>
        </div>
        <div>
          <div className="label-eyebrow mb-1">Margin</div>
          <div className="font-display text-xl text-slate">{(totalAgent - totalSupplier).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
