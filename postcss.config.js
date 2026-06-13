import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display text-3xl text-ink">Voyager</div>
          <div className="label-eyebrow mt-1">Travel Back Office</div>
        </div>

        <form onSubmit={handleSubmit} className="bg-paper rounded-lg shadow-sm border border-slate/10 p-8 space-y-4">
          <div>
            <label className="label-eyebrow block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="label-eyebrow block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate/20 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-coral text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white rounded py-2 text-sm font-medium hover:bg-slate transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
