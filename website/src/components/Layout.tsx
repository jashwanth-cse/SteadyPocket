import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Banknote, 
  AlertTriangle, 
  LogOut,
  Menu,
  X,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import GlobalSearch from './GlobalSearch';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('is_admin');
    window.location.href = '/login';
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/riders', icon: Users, label: 'Riders' },
    { to: '/policies', icon: ShieldCheck, label: 'Policies' },
    { to: '/payouts', icon: Banknote, label: 'Payouts' },
    { to: '/fraud', icon: AlertTriangle, label: 'Fraud Alerts' },
    { to: '/logs', icon: Clock, label: 'Audit Logs' },
  ];

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-neutral-200 font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-white/5 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Steady Pocket Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Steady Pocket Admin</span>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-neutral-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-white/5 bg-[#111111]/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-neutral-400 hover:text-white"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <GlobalSearch />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{auth.currentUser?.email}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-emerald-400 font-bold">
              {auth.currentUser?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
