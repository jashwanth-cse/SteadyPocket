import { motion } from 'motion/react';
import { 
  Clock, 
  User, 
  ShieldAlert, 
  Banknote,
  Download
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { downloadCSV } from '../utils/exportUtils';

export default function Logs() {
  const { systemEvents, isLoading } = useStore();

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-neutral-500">Traceable history of all administrative actions.</p>
        </div>
        <button 
          onClick={() => downloadCSV(systemEvents, 'audit-logs-report')}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-bold w-fit"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
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
              {systemEvents.map((event, i) => (
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
