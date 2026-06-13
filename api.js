import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', module: null },
  { to: '/reservations', label: 'Reservations', module: 'reservations' },
  { to: '/clients-agents', label: 'Clients & Agents', module: 'clients_agents' },
  { to: '/suppliers', label: 'Suppliers', module: 'suppliers' },
  { to: '/payment-requests', label: 'Payment Requests', module: 'payment_requests' },
  { to: '/reports', label: 'Reports', module: 'reports' },
  { to: '/users', label: 'Users', module: 'users' }
];

export default function Sidebar() {
  const { user, can, logout } = useAuth();

  return (
    <aside className="w-60 bg-ink text-cloud flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-slate/40">
        <div className="font-display text-xl tracking-tight">Voyager</div>
        <div className="label-eyebrow text-mist mt-1">Back Office</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          if (item.module && !can(item.module, 'view')) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive ? 'bg-slate text-white' : 'text-cloud/80 hover:bg-slate/30'
                }`
              }
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate/40 text-sm">
        <div className="font-medium">{user?.full_name}</div>
        <div className="text-mist text-xs mb-2">{user?.role}</div>
        <button onClick={logout} className="text-coral hover:underline text-xs">
          Sign out
        </button>
      </div>
    </aside>
  );
}
