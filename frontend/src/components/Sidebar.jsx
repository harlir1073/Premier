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

export default function Sidebar({ open, onClose }) {
  const { user, can, logout } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-ink/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 w-60 bg-ink text-cloud flex flex-col h-screen
          transform transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-6 py-6 border-b border-slate/40 flex items-center justify-between">
          <div>
            <div className="font-display text-xl tracking-tight">Premier System</div>
            <div className="label-eyebrow text-mist mt-1">Back Office</div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 -mr-2 text-cloud/70 hover:text-cloud"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            if (item.module && !can(item.module, 'view')) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
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
    </>
  );
}
