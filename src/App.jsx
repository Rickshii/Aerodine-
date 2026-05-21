import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, ChefHat, BarChart3, Settings, Moon, Sun, Bell, LogOut, ShieldAlert, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSkeleton from './components/LoadingSkeleton';
import toast, { Toaster } from 'react-hot-toast';

// Lazy Load Dashboards for optimized bundle sizes
const Login = lazy(() => import('./pages/Login'));
const WaiterPanel = lazy(() => import('./pages/WaiterPanel'));
const BillingDashboard = lazy(() => import('./pages/BillingDashboard'));
const ChefDisplay = lazy(() => import('./pages/ChefDisplay'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-mint-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Waiter Panel', icon: LayoutGrid, roles: ['waiter', 'manager', 'admin'] },
    { path: '/billing', label: 'Billing', icon: FileText, roles: ['cashier', 'manager', 'admin'] },
    { path: '/chef', label: 'Kitchen KDS', icon: ChefHat, roles: ['chef', 'manager', 'admin'] },
    { path: '/manager', label: 'Manager Panel', icon: BarChart3, roles: ['manager', 'admin'] },
    { path: '/admin', label: 'Super Admin', icon: Settings, roles: ['admin'] }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className={`fixed inset-y-0 left-0 lg:relative z-50 w-80 h-full bg-[#F8F7F4]/90 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800/80 flex flex-col p-6 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} aria-label="Main Navigation">
      <div className="flex items-center justify-between gap-3 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-orange-500/20">
            AD
          </div>
          <div>
            <h2 className="font-extrabold text-lg leading-none tracking-tight text-slate-950 dark:text-white">AeroDine</h2>
            <span className="text-[10px] text-orange-500 font-extrabold tracking-wider uppercase mt-1 block">
              {user?.role === 'admin' ? 'Super Admin' : user?.role} Mode
            </span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white" aria-label="Close navigation menu">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${isActive ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-glow-orange font-extrabold' : 'text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30'}`}
            >
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-450'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${user?.role}&background=FF8A3D&color=fff`}
            alt="User avatar"
            className="w-10 h-10 rounded-full border-2 border-orange-550/20"
          />
          <div>
            <div className="font-extrabold text-sm capitalize text-slate-950 dark:text-white">{user?.role}</div>
            <div className="text-xs text-slate-455 font-bold">Online</div>
          </div>
        </div>
        <button onClick={handleLogout} className="p-3 bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all" aria-label="Log out session">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

function AppLayout() {
  const { user } = useAuth();
  const { notifications, clearNotifications } = useStore();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === '/chef' || user?.role === 'chef') {
      setIsDark(true);
    }
  }, [location.pathname, user?.role]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDark) {
      document.body.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Real-time dynamic notification dispatcher
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latest = notifications[0];
      const ageMs = Date.now() - new Date(latest.timestamp).getTime();
      if (ageMs < 4000) {
        // Play luxury chime
        try {
          const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav');
          chime.volume = 0.25;
          chime.play().catch(() => {});
        } catch (e) {}

        // Pop high-contrast luxury notification toast
        toast((t) => (
          <div className="flex flex-col gap-1 p-1">
            <span className="font-extrabold text-[10px] text-[#FF8A3D] uppercase tracking-wider">📢 KDS Broadcast Alert</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{latest.message}</span>
          </div>
        ), {
          icon: '🍳',
          duration: 5000,
          style: {
            background: '#F8F7F4',
            color: '#111111',
            borderRadius: '20px',
            border: '2px solid #FF8A3D',
            boxShadow: '0 10px 30px rgba(255, 138, 61, 0.15)'
          }
        });
      }
    }
  }, [notifications]);

  const showSidebar = user && location.pathname !== '/login' && location.pathname !== '/unauthorized';

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-300">
      <Toaster position="top-right" />
      {showSidebar && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      
      {showSidebar && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
        />
      )}
      
      <div className="flex-1 h-full overflow-y-auto px-4 py-4 md:px-10 md:py-8 relative flex flex-col gap-6">
        {showSidebar && (
          <header className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-655 dark:text-slate-350 hover:text-orange-500 transition-all flex-shrink-0"
                aria-label="Open sidebar"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-extrabold tracking-tight capitalize text-slate-950 dark:text-white truncate max-w-[150px] md:max-w-none">{location.pathname.replace('/', '') || 'Order Board'}</h1>
                  <span className="flex items-center gap-1.5 bg-orange-500/10 text-orange-500 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-orange-550/30 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-orange-550 rounded-full animate-ping"></span>
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-slate-455 font-bold hidden md:block">Welcome to your luxury workspace dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsDark(!isDark)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm text-slate-650 dark:text-slate-350 hover:text-orange-500 transition-all" aria-label="Toggle visual theme">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm text-slate-650 dark:text-slate-350 hover:text-orange-500 transition-all relative" aria-label="View recent notifications">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
              </button>
            </div>
          </header>
        )}
        
        <main className="flex-1 min-h-0">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSkeleton />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={
                  <ProtectedRoute allowedRoles={['waiter', 'manager', 'admin']}>
                    <WaiterPanel />
                  </ProtectedRoute>
                } />
                
                <Route path="/billing" element={
                  <ProtectedRoute allowedRoles={['cashier', 'manager', 'admin']}>
                    <BillingDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/chef" element={
                  <ProtectedRoute allowedRoles={['chef', 'manager', 'admin']}>
                    <ChefDisplay />
                  </ProtectedRoute>
                } />
                
                <Route path="/manager" element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/unauthorized" element={
                  <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
                    <ShieldAlert size={64} className="text-red-500 animate-bounce" />
                    <h1 className="text-3xl font-bold">Access Denied</h1>
                    <p className="text-slate-400">You don't have authorization to view this panel.</p>
                    <Link to="/login" className="btn-premium bg-mint-500 text-white mt-4">Go to Login</Link>
                  </div>
                } />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Router>
          <AppLayout />
        </Router>
      </StoreProvider>
    </AuthProvider>
  );
}
