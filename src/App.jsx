import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, ChefHat, BarChart3, Settings, Moon, Sun, Bell, LogOut, ShieldAlert, Menu, X, Zap, Heart, Droplets, Leaf, Palette } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--color-primary)]">
        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
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
    <aside className={`fixed inset-y-0 left-0 lg:relative z-50 w-72 h-full glass rounded-none border-t-0 border-b-0 border-l-0 flex flex-col p-6 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} aria-label="Main Navigation">
      <div className="flex items-center justify-between gap-3 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
            AD
          </div>
          <div>
            <h2 className="font-extrabold text-lg leading-none tracking-tight text-[var(--color-text-main)]">AeroDine</h2>
            <span className="text-[10px] text-[var(--color-primary)] font-extrabold tracking-wider uppercase mt-1 block">
              {user?.role === 'admin' ? 'Super Admin' : user?.role} Mode
            </span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
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
              className={`flex items-center gap-4 px-5 py-4 rounded-xl font-bold text-sm transition-all ${isActive ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg shadow-[var(--shadow-color)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--bg-glass)]'}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-[var(--border-color)] flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${user?.role}&background=random&color=fff`}
            alt="User avatar"
            className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)]"
          />
          <div>
            <div className="font-extrabold text-sm capitalize text-[var(--color-text-main)]">{user?.role}</div>
            <div className="text-xs text-[var(--color-text-muted)] font-bold">Online</div>
          </div>
        </div>
        <button onClick={handleLogout} className="p-3 bg-[var(--bg-glass)] text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Waiter', icon: LayoutGrid, roles: ['waiter', 'manager', 'admin'] },
    { path: '/billing', label: 'Billing', icon: FileText, roles: ['cashier', 'manager', 'admin'] },
    { path: '/chef', label: 'KDS', icon: ChefHat, roles: ['chef', 'manager', 'admin'] },
    { path: '/manager', label: 'Manager', icon: BarChart3, roles: ['manager', 'admin'] }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

  if (!filteredItems.length) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 glass z-40 rounded-t-3xl border-b-0 border-x-0 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      <nav className="flex items-center justify-around p-2">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${isActive ? 'text-[var(--color-primary)] scale-110' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
            >
              <item.icon size={isActive ? 24 : 20} className="transition-all duration-300" />
              <span className={`text-[10px] font-bold transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

const themes = [
  { id: 'light', icon: Sun, name: 'Light' },
  { id: 'dark', icon: Moon, name: 'Dark' },
  { id: 'neon', icon: Zap, name: 'Neon' },
  { id: 'rose', icon: Heart, name: 'Rose' },
  { id: 'ocean', icon: Droplets, name: 'Ocean' },
  { id: 'emerald', icon: Leaf, name: 'Emerald' }
];

function ThemeSwitcher({ currentTheme, setTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const CurrentIcon = themes.find(t => t.id === currentTheme)?.icon || Sun;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 glass rounded-full shadow-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center border-none"
        aria-label="Toggle theme menu"
      >
        <CurrentIcon size={18} className="animate-spin-slow" style={{ animationDuration: '3s' }} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-2 glass rounded-2xl shadow-xl flex flex-col gap-1 min-w-[140px] z-50 border-[var(--border-color)]">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => {
                setTheme(theme.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all ${currentTheme === theme.id ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-md' : 'text-[var(--color-text-muted)] hover:bg-[var(--bg-glass)] hover:text-[var(--color-text-main)]'}`}
            >
              <theme.icon size={16} />
              {theme.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AppLayout() {
  const { user } = useAuth();
  const { notifications } = useStore();
  const location = useLocation();
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('app-theme') || 'light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('app-theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toastedNotifications = React.useRef(new Set());

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latest = notifications[0];
      
      if (!toastedNotifications.current.has(latest.id)) {
        toastedNotifications.current.add(latest.id);
        
        toast.custom((t) => (
          <div className={`glass-card flex items-start gap-3 p-4 rounded-2xl border border-[var(--color-primary)]/30 shadow-[0_10px_40px_rgba(var(--color-primary-rgb),0.15)] bg-[var(--bg-panel)]/95 backdrop-blur-xl max-w-sm w-full transition-all duration-300 transform ${t.visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}`}>
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
              <Bell size={16} className="text-[var(--color-primary)] animate-pulse" />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between items-center w-full">
                <span className="font-extrabold text-[10px] text-[var(--color-primary)] uppercase tracking-wider">📢 KDS Broadcast</span>
                <button onClick={() => toast.dismiss(t.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
                  <X size={14} />
                </button>
              </div>
              <span className="text-sm font-bold text-[var(--color-text-main)] leading-snug">{latest.message}</span>
            </div>
          </div>
        ), {
          id: latest.id,
          duration: 4000,
          position: 'top-center'
        });
      }
    }
  }, [notifications]);

  const showSidebar = user && location.pathname !== '/login' && location.pathname !== '/unauthorized';

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-panel)',
            color: 'var(--color-text-main)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 30px var(--shadow-color)',
            fontWeight: 'bold'
          }
        }}
      />

      {showSidebar && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

      {showSidebar && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      <div className="flex-1 h-full overflow-y-auto px-4 py-4 md:px-8 md:py-8 pb-24 lg:pb-8 relative flex flex-col gap-6 scroll-smooth">
        {showSidebar && (
          <header className="flex justify-between items-center pb-4 border-b border-[var(--border-color)] gap-4 sticky top-0 bg-[var(--bg-main)]/80 backdrop-blur-lg z-30 -mx-4 px-4 md:-mx-8 md:px-8 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2.5 glass rounded-xl shadow-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all flex-shrink-0 border-none"
              >
                <Menu size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-extrabold tracking-tight capitalize text-[var(--color-text-main)] truncate max-w-[150px] md:max-w-none">
                    {location.pathname === '/' ? 'Waiter Panel' : location.pathname.replace('/', '')}
                  </h1>
                  <span className="flex items-center gap-1.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-[var(--color-primary)]/30 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-ping"></span>
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] font-bold hidden md:block">Welcome to your luxury workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher currentTheme={currentTheme} setTheme={setCurrentTheme} />
              <button className="p-3 glass rounded-full shadow-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all relative border-none">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[var(--color-primary)] border-2 border-[var(--bg-main)] rounded-full animate-pulse"></span>
              </button>
            </div>
          </header>
        )}

        <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto">
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
                  <div className="min-h-[80vh] w-full flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--color-text-main)] gap-4 glass-card p-10">
                    <ShieldAlert size={64} className="text-[var(--color-primary)] animate-bounce" />
                    <h1 className="text-3xl font-extrabold text-gradient">Access Denied</h1>
                    <p className="text-[var(--color-text-muted)] text-center max-w-md">You don't have the required authorization to view this luxury panel.</p>
                    <Link to="/login" className="btn-premium mt-4">Return to Login</Link>
                  </div>
                } />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {showSidebar && <BottomNav />}
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

