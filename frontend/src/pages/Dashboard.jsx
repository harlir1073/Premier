import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-paper rounded-lg border border-slate/10 p-5">
      <div className="label-eyebrow mb-2">{label}</div>
      <div className={`font-display text-3xl ${accent || 'text-ink'}`}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user, can } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [agentOutstanding, setAgentOutstanding] = useState([]);
  const [supplierOutstanding, setSupplierOutstanding] = useState([]);

  useEffect(() => {
    api.get('/notifications').then(setNotifications).catch(() => {});
    if (can('reports', 'view')) {
      api.get('/reports/outstanding-agent-payments').then(setAgentOutstanding).catch(() => {});
      api.get('/reports/outstanding-supplier-payments').then(setSupplierOutstanding).catch(() => {});
    }
  }, []);

  const agentTotal = agentOutstanding.reduce((s, r) => s + parseFloat(r.agent_price), 0);
  const supplierTotal = supplierOutstanding.reduce((s, r) => s + parseFloat(r.supplier_price), 0);

  return (
    <div className="p-8 space-y-8">
      <div>
        <div className="label-eyebrow mb-1">Welcome back</div>
        <h1 className="font-display text-3xl">{user?.full_name}</h1>
      </div>

      {can('reports', 'view') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Outstanding from agents" value={`$${agentTotal.toLocaleString()}`} accent="text-slate" />
          <StatCard label="Outstanding to suppliers" value={`$${supplierTotal.toLocaleString()}`} accent="text-coral" />
          <StatCard label="Unread alerts" value={notifications.filter(n => !n.is_read).length} accent="text-amber" />
        </div>
      )}

      <div className="bg-paper rounded-lg border border-slate/10">
        <div className="px-5 py-4 border-b border-slate/10 font-display text-lg">Recent alerts</div>
        <div className="divide-y divide-slate/10">
          {notifications.length === 0 && (
            <div className="px-5 py-6 text-sm text-mist">No alerts right now — everything looks settled.</div>
          )}
          {notifications.slice(0, 8).map(n => (
            <div key={n.id} className="px-5 py-3 flex items-center justify-between text-sm">
              <span>{n.message}</span>
              <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${
                n.severity === 'critical' ? 'bg-coral/10 text-coral' : 'bg-amber/10 text-amber'
              }`}>
                {n.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
