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
  Clock,
  ChevronDown
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import GlobalSearch from './GlobalSearch';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
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
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#111111]/95 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64 shadow-2xl lg:shadow-none",
          !isSidebarOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Steady Pocket Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex-1">Steady Pocket</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-neutral-500 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
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

        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-white/5 bg-[#111111]/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <GlobalSearch />
            
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 rounded-full hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/10"
              >
                <div className="text-right hidden sm:block px-1">
                  <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{auth.currentUser?.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-none mt-0.5">Administrator</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
                  {auth.currentUser?.email?.[0].toUpperCase()}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform duration-300", isProfileOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-56 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] backdrop-blur-md"
                  >
                    <div className="p-4 border-b border-white/5">
                      <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-1">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{auth.currentUser?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
                      >
                        <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          
          <footer className="mt-12 py-8 border-t border-white/5 text-center">
            <p className="text-neutral-600 text-xs tracking-widest uppercase font-medium">
              &copy; {new Date().getFullYear()} Steady Pocket Platform • Built for Hackathon Demo • <span className="text-emerald-500/50">For Educational Purpose Only</span>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
