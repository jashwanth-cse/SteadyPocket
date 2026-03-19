import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  User, 
  ShieldAlert, 
  Banknote,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { downloadCSV } from '../utils/exportUtils';

export default function Logs() {
  const { systemEvents, isLoading } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-lg" />
        <div className="h-[500px] bg-white/5 rounded-3xl" />
      </div>
    );
  }

  const getActionIcon = (action: string = '') => {
    const act = (action || '').toUpperCase();
    if (act.includes('USER') || act.includes('RIDER')) return <User className="w-4 h-4 text-blue-400" />;
    if (act.includes('PAYOUT')) return <Banknote className="w-4 h-4 text-emerald-400" />;
    if (act.includes('FRAUD')) return <ShieldAlert className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-neutral-500" />;
  };

  const filteredEvents = systemEvents.filter(event => {
    const action = (event.action || '').toLowerCase();
    const admin = (event.adminId || '').toLowerCase();
    const target = (event.targetId || '').toLowerCase();
    const details = JSON.stringify(event.metadata || event.details || {}).toLowerCase();
    
    const matchesSearch = 
      action.includes(searchQuery.toLowerCase()) || 
      admin.includes(searchQuery.toLowerCase()) || 
      target.includes(searchQuery.toLowerCase()) || 
      details.includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || 
      (actionFilter === 'USER' && (action.includes('user') || action.includes('rider'))) ||
      (actionFilter === 'PAYOUT' && action.includes('payout')) ||
      (actionFilter === 'FRAUD' && action.includes('fraud'));
    
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-neutral-500">Traceable history of all administrative actions.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 w-full sm:w-64 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#111111] p-1 rounded-xl border border-white/5">
            {['all', 'USER', 'PAYOUT', 'FRAUD'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActionFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  actionFilter === filter 
                    ? 'bg-emerald-500 text-black' 
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>

          <button 
            onClick={() => downloadCSV(filteredEvents, 'audit-logs-report')}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-bold w-full sm:w-fit"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-neutral-500 font-bold uppercase tracking-wider text-xs">Timestamp</th>
                <th className="px-8 py-6 text-neutral-500 font-bold uppercase tracking-wider text-xs">Admin</th>
                <th className="px-8 py-6 text-neutral-500 font-bold uppercase tracking-wider text-xs">Action</th>
                <th className="px-8 py-6 text-neutral-500 font-bold uppercase tracking-wider text-xs">Target</th>
                <th className="px-8 py-6 text-neutral-500 font-bold uppercase tracking-wider text-xs text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.map((event, i) => (
                <tr key={event.id || i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6 text-neutral-400 font-mono text-xs">
                    {event.timestamp ? (
                      event.timestamp.toDate 
                        ? event.timestamp.toDate().toLocaleString() 
                        : new Date(event.timestamp).toLocaleString()
                    ) : 'Recent'}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                        {(event.adminId || 'S')[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{event.adminId || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {getActionIcon(event.action)}
                      <span className="font-bold text-white text-xs uppercase tracking-wider">{event.action || 'Internal'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <code className="text-xs bg-white/5 px-2 py-1 rounded text-neutral-400">
                      {event.targetId || 'N/A'}
                    </code>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="text-xs text-neutral-500 max-w-xs ml-auto truncate">
                      {JSON.stringify(event.metadata || event.details || {})}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
