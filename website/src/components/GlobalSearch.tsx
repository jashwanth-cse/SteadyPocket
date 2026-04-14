import { useState, useEffect, useRef } from 'react';
import { Search, X, User, Banknote, AlertTriangle, ShieldCheck, CornerDownLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { riders, payouts, alerts, policies } = useStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const searchResults = [
      ...riders.filter(r => 
        (r.emp_name || '').toLowerCase().includes(q) || 
        (r.phone || '').toString().includes(q)
      ).map(r => ({ ...r, type: 'rider', icon: User, path: '/riders' })),

      ...payouts.filter(p => 
        (p.id || '').toLowerCase().includes(q) || 
        (p.userId || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q)
      ).map(p => ({ ...p, type: 'payout', icon: Banknote, path: '/payouts' })),

      ...alerts.filter(a => 
        (a.alert_type || '').toLowerCase().includes(q) || 
        (a.rider_name || '').toLowerCase().includes(q)
      ).map(a => ({ ...a, type: 'alert', icon: AlertTriangle, path: '/fraud' })),

      ...policies.filter(p => 
        (p.id || '').toLowerCase().includes(q) || 
        (p.rider_name || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q)
      ).map(p => ({ ...p, type: 'policy', icon: ShieldCheck, path: '/policies' }))
    ].slice(0, 8);

    setResults(searchResults);
  }, [query, riders, payouts, alerts, policies]);

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-3 sm:px-4 py-2 bg-[#111111] border border-white/5 rounded-xl text-neutral-500 hover:text-white hover:border-white/10 transition-all group w-10 sm:w-48 lg:w-64"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium flex-1 text-left hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-mono">
          <CornerDownLeft className="w-2.5 h-2.5" /> K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -20 }}
              className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center gap-4 p-6 border-b border-white/5">
                <Search className="w-5 h-5 text-emerald-500" />
                <input 
                  ref={inputRef}
                  type="text" 
                  placeholder="Search for riders, payouts, alerts, policies..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-lg w-full placeholder:text-neutral-600"
                />
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto no-scrollbar p-2">
                {results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((result, idx) => (
                      <button
                        key={`${result.type}-${result.id}-${idx}`}
                        onClick={() => handleSelect(result.path)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 group transition-all text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-white/5 text-neutral-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
                            <result.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-white leading-none mb-1">
                              {result.emp_name || result.rider_name || `ID: ${result.id}`}
                            </p>
                            <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                              {result.type} • {result.id}
                            </p>
                          </div>
                        </div>
                        <CornerDownLeft className="w-4 h-4 text-neutral-700 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : query.trim() ? (
                  <div className="p-12 text-center text-neutral-500">
                    <p className="text-lg">No results found for "{query}"</p>
                    <p className="text-sm">Try searching for a name, phone number, or ID.</p>
                  </div>
                ) : (
                  <div className="p-12 text-center text-neutral-600">
                    <p className="text-sm font-bold uppercase tracking-widest mb-2">Quick Access</p>
                    <div className="flex justify-center gap-4 text-xs">
                      <span>Riders</span>
                      <span>•</span>
                      <span>Payouts</span>
                      <span>•</span>
                      <span>Fraud Alerts</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
