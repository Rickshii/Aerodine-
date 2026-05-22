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
 { label: 'Waiter', value: 'waiter', color: 'bg-rose-500/10 text-rose-500 border-[var(--color-secondary)]/20' },
 { label: 'Chef', value: 'chef', color: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20' },
 { label: 'Cashier', value: 'cashier', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
 { label: 'Manager', value: 'manager', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
 { label: 'Super Admin', value: 'admin', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' }
 ];

 return (
 <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--bg-panel)] overflow-hidden relative">
 <Toaster position="top-right" />
 {/* Decorative Orbs */}
 <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--color-primary)]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
 <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

 <div className="glass w-full max-w-md p-8 relative z-10 border border-[var(--border-color)] shadow-2xl">
 <div className="text-center mb-8">
 <div className="w-16 h-16 bg-[var(--color-primary)] rounded-2xl mx-auto flex items-center justify-center text-[var(--color-text-main)] font-bold text-2xl shadow-lg shadow-rose-600/30 mb-4">
 AD
 </div>
 <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-main)]">AeroDine SaaS</h2>
 <p className="text-sm text-[var(--color-text-muted)] mt-2">Enter credentials or choose a quick-access role</p>
 </div>

 <form onSubmit={handleLogin} className="space-y-6">
 <div>
 <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Preset Demo Roles</label>
 <div className="grid grid-cols-3 gap-2">
 {presetRoles.slice(0, 3).map((r) => (
 <button
 type="button"
 key={r.value}
 onClick={() => setRole(r.value)}
 className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${role === r.value ? 'glass-card text-gray-100 border-white font-bold' : 'glass-card/50 text-[var(--color-text-muted)] border-[var(--border-color)]/50 hover:glass-card'}`}
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
 className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${role === r.value ? 'glass-card text-gray-100 border-white font-bold' : 'glass-card/50 text-[var(--color-text-muted)] border-[var(--border-color)]/50 hover:glass-card'}`}
 >
 {r.label}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-semibold text-[var(--color-text-muted)]">Email Address</label>
 <div className="relative">
 <Mail className="absolute left-3 top-3.5 text-[var(--color-text-muted)]" size={18} />
 <input
 type="email"
 placeholder={`${role}@aerodine.com`}
 value={email}
 onChange={e => setEmail(e.target.value)}
 className="w-full glass-card/50 border border-[var(--border-color)]/50 rounded-2xl py-3 pl-10 pr-4 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-primary)] transition-all text-sm"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-semibold text-[var(--color-text-muted)]">Password</label>
 <div className="relative">
 <Lock className="absolute left-3 top-3.5 text-[var(--color-text-muted)]" size={18} />
 <input
 type="password"
 placeholder="••••••••"
 value={password}
 onChange={e => setPassword(e.target.value)}
 className="w-full glass-card/50 border border-[var(--border-color)]/50 rounded-2xl py-3 pl-10 pr-4 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-primary)] transition-all text-sm"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full btn-premium btn-premium rounded-2xl py-4 shadow-lg shadow-rose-600/20 font-bold transition-all flex items-center justify-center gap-2"
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
