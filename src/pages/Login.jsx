import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ChefHat, CreditCard, BarChart3, Crown, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ROLES = [
  {
    label: 'Waiter',
    value: 'waiter',
    icon: UtensilsCrossed,
    description: 'Table service & orders',
    gradient: 'from-orange-500 to-amber-500',
    glow: 'shadow-orange-500/30',
    bgActive: 'bg-gradient-to-br from-orange-50 to-amber-50',
    border: 'border-orange-400',
    text: 'text-orange-700',
  },
  {
    label: 'Chef',
    value: 'chef',
    icon: ChefHat,
    description: 'Kitchen display system',
    gradient: 'from-red-500 to-rose-500',
    glow: 'shadow-red-500/30',
    bgActive: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-400',
    text: 'text-red-700',
  },
  {
    label: 'Cashier',
    value: 'cashier',
    icon: CreditCard,
    description: 'Billing & payments',
    gradient: 'from-blue-500 to-indigo-500',
    glow: 'shadow-blue-500/30',
    bgActive: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-blue-400',
    text: 'text-blue-700',
  },
  {
    label: 'Manager',
    value: 'manager',
    icon: BarChart3,
    description: 'Analytics & menu control',
    gradient: 'from-violet-500 to-purple-500',
    glow: 'shadow-violet-500/30',
    bgActive: 'bg-gradient-to-br from-violet-50 to-purple-50',
    border: 'border-violet-400',
    text: 'text-violet-700',
  },
  {
    label: 'Super Admin',
    value: 'admin',
    icon: Crown,
    description: 'Full system access',
    gradient: 'from-yellow-500 to-orange-500',
    glow: 'shadow-yellow-500/30',
    bgActive: 'bg-gradient-to-br from-yellow-50 to-orange-50',
    border: 'border-yellow-400',
    text: 'text-yellow-700',
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('waiter');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const selectedRole = ROLES.find(r => r.value === role);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email || `${role}@aerodine.com`, password || 'password', role);
      toast.success(`Welcome back! Logged in as ${role.toUpperCase()}`, {
        style: { background: '#111', color: '#fff', fontWeight: 700 },
        iconTheme: { primary: '#f59e0b', secondary: '#111' },
      });
      setTimeout(() => {
        if (role === 'waiter') navigate('/');
        else if (role === 'cashier') navigate('/billing');
        else if (role === 'chef') navigate('/chef');
        else if (role === 'manager') navigate('/manager');
        else if (role === 'admin') navigate('/admin');
      }, 900);
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.', {
        style: { background: '#fff', color: '#111', fontWeight: 700 },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      <Toaster position="top-right" />

      {/* Animated ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-15 blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', animationDelay: '2s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4 py-8">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-2xl shadow-orange-500/40"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
            <UtensilsCrossed size={28} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2" style={{ fontFamily: "'Poppins', sans-serif", textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            AeroDine
          </h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Restaurant Management OS
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Card top accent */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${selectedRole?.gradient?.replace('from-', '').replace(' to-', ', ').replace(/(\w+-\d+)/g, (m) => {
            const map = { 'orange-500': '#f97316', 'amber-500': '#f59e0b', 'red-500': '#ef4444', 'rose-500': '#f43f5e', 'blue-500': '#3b82f6', 'indigo-500': '#6366f1', 'violet-500': '#8b5cf6', 'purple-500': '#a855f7', 'yellow-500': '#eab308' };
            return map[m] || m;
          })})` }} />

          <div className="p-8">
            {/* Card heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
                Welcome back
              </h2>
              <p className="text-sm font-medium text-gray-500">
                Select your role and sign in to continue
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">

              {/* Role Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Select Role
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {ROLES.slice(0, 3).map((r) => {
                    const Icon = r.icon;
                    const isActive = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-300 group ${
                          isActive
                            ? `${r.bgActive} ${r.border} shadow-lg`
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? `bg-gradient-to-br ${r.gradient} shadow-md`
                            : 'bg-gray-200 group-hover:bg-gray-300'
                        }`}>
                          <Icon size={15} color={isActive ? '#fff' : '#6b7280'} strokeWidth={2.5} />
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isActive ? r.text : 'text-gray-500'}`}>
                          {r.label}
                        </span>
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-current opacity-70" style={{ color: 'inherit' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.slice(3).map((r) => {
                    const Icon = r.icon;
                    const isActive = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`relative flex items-center gap-3 py-3 px-4 rounded-2xl border-2 transition-all duration-300 group ${
                          isActive
                            ? `${r.bgActive} ${r.border} shadow-lg`
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          isActive
                            ? `bg-gradient-to-br ${r.gradient} shadow-md`
                            : 'bg-gray-200 group-hover:bg-gray-300'
                        }`}>
                          <Icon size={15} color={isActive ? '#fff' : '#6b7280'} strokeWidth={2.5} />
                        </div>
                        <div className="text-left min-w-0">
                          <div className={`text-[10px] font-extrabold uppercase tracking-wider ${isActive ? r.text : 'text-gray-500'}`}>
                            {r.label}
                          </div>
                          <div className="text-[9px] text-gray-400 truncate font-medium mt-0.5">{r.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700" htmlFor="login-email">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    size={18}
                    style={{ color: focusedField === 'email' ? '#f59e0b' : '#9ca3af' }}
                  />
                  <input
                    id="login-email"
                    type="email"
                    placeholder={`${role}@aerodine.com`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold transition-all duration-200 outline-none"
                    style={{
                      background: focusedField === 'email' ? '#fffbeb' : '#f9fafb',
                      color: '#111827',
                      border: `2px solid ${focusedField === 'email' ? '#f59e0b' : '#e5e7eb'}`,
                      boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(245,158,11,0.1)' : 'none',
                      '::placeholder': { color: '#9ca3af' },
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700" htmlFor="login-password">
                  Password
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    size={18}
                    style={{ color: focusedField === 'password' ? '#f59e0b' : '#9ca3af' }}
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full rounded-2xl py-3.5 pl-11 pr-12 text-sm font-semibold transition-all duration-200 outline-none"
                    style={{
                      background: focusedField === 'password' ? '#fffbeb' : '#f9fafb',
                      color: '#111827',
                      border: `2px solid ${focusedField === 'password' ? '#f59e0b' : '#e5e7eb'}`,
                      boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(245,158,11,0.1)' : 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-medium pl-1">Leave blank to use demo credentials</p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-4 rounded-2xl font-extrabold text-base text-white flex items-center justify-center gap-2.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                    : 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  boxShadow: loading ? 'none' : '0 8px 30px rgba(245,158,11,0.4), 0 4px 15px rgba(239,68,68,0.3)',
                  letterSpacing: '0.02em',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <ShieldCheck size={20} />
                      Access {selectedRole?.label || role} Portal
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Demo note */}
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
                <p className="text-xs font-semibold text-green-700">
                  <strong>Demo Mode:</strong> Select a role above and click Access Portal — no credentials needed.
                </p>
              </div>
            </form>
          </div>

          {/* Card footer */}
          <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              © 2025 AeroDine Inc.
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-gray-500">All systems operational</span>
            </div>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-xs font-medium"
          style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}
        >
          Trusted by premium restaurants worldwide
        </motion.p>
      </div>
    </div>
  );
}
