import React, { useEffect, useState } from 'react';
import { api } from '../api';

const TABS = [
  { key: 'outstanding-agent-payments', label: 'Outstanding from agents' },
  { key: 'outstanding-supplier-payments', label: 'Outstanding to suppliers' },
  { key: 'profit-summary', label: 'Profit summary' }
];

export default function Reports() {
  const [tab, setTab] = useState(TABS[0].key);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/reports/${tab}`).then(setData);
  }, [tab]);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <div className="label-eyebrow mb-1">Insights</div>
        <h1 className="font-display text-3xl">Reports</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-ink text-white' : 'bg-paper border border-slate/10 text-ink hover:bg-cloud'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {!data && <div className="text-mist text-sm">Loading…</div>}

      {data && tab === 'outstanding-agent-payments' && (
        <ReportTable
          columns={['Booking', 'Agent', 'Product', 'Description', 'Amount', 'Due date', 'Status']}
          rows={data.map(r => [
            r.booking_reference, r.agent_name || '—', r.product_type, r.description || '—',
            `${r.agent_currency} ${parseFloat(r.agent_price).toLocaleString()}`,
            r.agent_payment_due_date ? new Date(r.agent_payment_due_date).toLocaleDateString() : '—',
            r.agent_payment_status
          ])}
        />
      )}

      {data && tab === 'outstanding-supplier-payments' && (
        <ReportTable
          columns={['Booking', 'Supplier', 'Product', 'Description', 'Amount', 'Due date', 'Status']}
          rows={data.map(r => [
            r.booking_reference, r.supplier_name || '—', r.product_type, r.description || '—',
            `${r.supplier_currency} ${parseFloat(r.supplier_price).toLocaleString()}`,
            r.supplier_payment_due_date ? new Date(r.supplier_payment_due_date).toLocaleDateString() : '—',
            r.supplier_payment_status
          ])}
        />
      )}

      {data && tab === 'profit-summary' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-paper border border-slate/10 rounded-lg p-5">
              <div className="label-eyebrow mb-1">Total agent revenue</div>
              <div className="font-display text-2xl">{data.totals.agent_total.toLocaleString()}</div>
            </div>
            <div className="bg-paper border border-slate/10 rounded-lg p-5">
              <div className="label-eyebrow mb-1">Total supplier cost</div>
              <div className="font-display text-2xl">{data.totals.supplier_total.toLocaleString()}</div>
            </div>
            <div className="bg-paper border border-slate/10 rounded-lg p-5">
              <div className="label-eyebrow mb-1">Total margin</div>
              <div className="font-display text-2xl text-slate">{data.totals.margin_total.toLocaleString()}</div>
            </div>
          </div>
          <ReportTable
            columns={['Booking', 'Agent', 'Product', 'Description', 'Date', 'Agent price', 'Supplier price', 'Margin']}
            rows={data.rows.map(r => [
              r.booking_reference, r.agent_name || '—', r.product_type, r.description || '—',
              r.start_date ? new Date(r.start_date).toLocaleDateString() : '—',
              parseFloat(r.agent_price).toLocaleString(), parseFloat(r.supplier_price).toLocaleString(), parseFloat(r.margin).toLocaleString()
            ])}
          />
        </>
      )}
    </div>
  );
}

function ReportTable({ columns, rows }) {
  return (
    <div className="bg-paper rounded-lg border border-slate/10 overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-cloud text-left">
          <tr>{columns.map(c => <th key={c} className="px-4 py-3 label-eyebrow whitespace-nowrap">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate/10">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-cloud/50">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 whitespace-nowrap">{cell}</td>)}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-mist">No data.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
