import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('waiter');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email || `${role}@aerodine.com`, password || 'password', role);
      toast.success(`Welcome back! Logged in as ${role.toUpperCase()}`);
      
      // Redirect based on role
      setTimeout(() => {
        if (role === 'waiter') navigate('/');
        else if (role === 'cashier') navigate('/billing');
        else if (role === 'chef') navigate('/chef');
        else if (role === 'manager') navigate('/manager');
        else if (role === 'admin') navigate('/admin');
      }, 1000);
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const presetRoles = [
    { label: 'Waiter', value: 'waiter', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { label: 'Chef', value: 'chef', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { label: 'Cashier', value: 'cashier', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { label: 'Manager', value: 'manager', color: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
    { label: 'Super Admin', value: 'admin', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' }
  ];

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
      <Toaster position="top-right" />
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-mint-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="glass w-full max-w-md p-8 relative z-10 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-mint-500 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-mint-500/30 mb-4">
            AD
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">AeroDine SaaS</h2>
          <p className="text-sm text-slate-400 mt-2">Enter credentials or choose a quick-access role</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Preset Demo Roles</label>
            <div className="grid grid-cols-3 gap-2">
              {presetRoles.slice(0, 3).map((r) => (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${role === r.value ? 'bg-white text-slate-900 border-white font-bold' : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-800'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {presetRoles.slice(3).map((r) => (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${role === r.value ? 'bg-white text-slate-900 border-white font-bold' : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-800'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input
                type="email"
                placeholder={`${role}@aerodine.com`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-mint-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-mint-500 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-premium bg-mint-500 hover:bg-mint-600 text-white rounded-2xl py-4 shadow-lg shadow-mint-500/20 font-bold transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck size={20} />
                Access {role.toUpperCase()} Portal
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
