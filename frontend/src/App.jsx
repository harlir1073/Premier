import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientsAgents from './pages/ClientsAgents';
import Suppliers from './pages/Suppliers';
import Reservations from './pages/Reservations';
import ReservationNew from './pages/ReservationNew';
import ReservationDetail from './pages/ReservationDetail';
import PaymentRequests from './pages/PaymentRequests';
import Reports from './pages/Reports';
import Users from './pages/Users';

function PrivateLayout({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between bg-ink text-cloud px-4 h-14 sticky top-0 z-20 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="p-2 -ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="font-display text-lg tracking-tight">Premier System</div>
          <div className="w-6" />
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
          <Route path="/reservations" element={<PrivateLayout><Reservations /></PrivateLayout>} />
          <Route path="/reservations/new" element={<PrivateLayout><ReservationNew /></PrivateLayout>} />
          <Route path="/reservations/:id" element={<PrivateLayout><ReservationDetail /></PrivateLayout>} />
          <Route path="/clients-agents" element={<PrivateLayout><ClientsAgents /></PrivateLayout>} />
          <Route path="/suppliers" element={<PrivateLayout><Suppliers /></PrivateLayout>} />
          <Route path="/payment-requests" element={<PrivateLayout><PaymentRequests /></PrivateLayout>} />
          <Route path="/reports" element={<PrivateLayout><Reports /></PrivateLayout>} />
          <Route path="/users" element={<PrivateLayout><Users /></PrivateLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
