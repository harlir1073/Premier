import React from 'react';
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
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
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
