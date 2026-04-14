import { useState } from 'react';
import { auth } from '../firebase';
import { useStore } from '../store/useStore';
import { 
  AlertTriangle, 
  User, 
  ShieldAlert, 
  CheckCircle, 
  Ban,
  Search,
  Filter,
  MoreHorizontal,
  CloudRain
} from 'lucide-react';
import { motion } from 'motion/react';

interface FraudAlert {
  id: string;
  user_id: string;
  rider_name?: string;
  alert_type: 'location_mismatch' | 'duplicate_account' | 'identity_mismatch' | 'payout_abuse';
  risk_score: number;
  status: string;
  timestamp: string;
}

export default function Fraud() {
  const { alerts, isLoading, performAction, getUserName } = useStore();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getAlertBadge = (type: string) => {
    const labels: Record<string, string> = {
      location_mismatch: 'Location Mismatch',
      duplicate_account: 'Duplicate Account',
      identity_mismatch: 'Identity Mismatch',
      payout_abuse: 'Payout Abuse'
    };
    return labels[type] || type;
  };

  const handleAlertAction = async (alertId: string, status: string) => {
    setProcessingId(alertId);
    try {
      await performAction(`/api/fraud/${alertId}`, 'PATCH', { status });
    } catch (err: any) {
      // Error already shown via alert(err.message)

      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-lg" />
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#111111] p-4 rounded-3xl border border-white/5">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by Rider Name or Alert ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
          {['all', 'pending', 'Under_review', 'Resolved', 'Ignored', 'Action_required'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === status 
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                  : 'bg-white/5 text-neutral-500 hover:text-white border border-transparent hover:border-white/10'
              }`}
            >
              {status === 'all' ? 'All Alerts' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts
          .filter(alert => {
            const matchesSearch = 
              alert.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (getUserName(alert.user_id) || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const currentStatus = (alert.status || 'pending').toLowerCase();
            const targetFilter = statusFilter.toLowerCase();
            const matchesStatus = statusFilter === 'all' || currentStatus === targetFilter;
            
            return matchesSearch && matchesStatus;
          })
          .map((alert, i) => (
          <motion.div 
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#111111] border border-white/5 rounded-3xl p-6 flex flex-col xl:flex-row xl:items-center gap-6 group hover:border-emerald-500/20 transition-all"
          >
            {/* Left: Indicator & User Info */}
            <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${alert.risk_score > 0.8 ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500 shadow-lg shadow-yellow-500/5'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <span className="text-base font-bold text-white truncate">{getUserName((alert as any).user_id || (alert as any).userId)}</span>
                  <span className="w-fit text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-neutral-500 whitespace-nowrap">
                    {getAlertBadge(alert.alert_type || 'general')}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 flex items-center gap-1 font-mono truncate">
                  {alert.id.slice(0, 8)}... • {alert.timestamp ? (
                    typeof alert.timestamp === 'string' 
                      ? new Date(alert.timestamp).toLocaleDateString()
                      : alert.timestamp?.seconds 
                        ? new Date(alert.timestamp.seconds * 1000).toLocaleDateString()
                        : 'N/A'
                  ) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Middle: Metrics & Status */}
            <div className="flex items-center justify-between xl:justify-start gap-8 sm:gap-12 lg:gap-24 w-full xl:w-auto border-t border-white/5 pt-6 xl:border-none xl:pt-0">
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1 opacity-60">Risk Score</p>
                <p className={`text-xl font-black ${(alert.risk_score || 0) > 0.8 ? 'text-red-500' : 'text-yellow-500'}`}>
                  {((alert.risk_score || 0) * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1 opacity-60">Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    alert.status === 'Resolved' ? 'bg-emerald-500' : 
                    alert.status === 'Under_review' ? 'bg-yellow-500' : 
                    alert.status === 'Ignored' ? 'bg-neutral-500' : 'bg-red-500 animate-pulse'
                  }`} />
                  <span className="text-sm font-bold text-white">{alert.status || 'Pending'}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="grid grid-cols-3 xl:flex xl:items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
              <button 
                onClick={() => handleAlertAction(alert.id, 'Ignored')}
                disabled={processingId === alert.id}
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-3 bg-white/5 text-neutral-400 border border-white/5 rounded-xl hover:bg-neutral-500/10 hover:text-neutral-300 transition-all ${processingId === alert.id ? 'opacity-50 cursor-not-allowed' : ''}`} 
                title="Ignore Alert"
              >
                <Ban className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Ignore</span>
              </button>
              
              <button 
                onClick={() => handleAlertAction(alert.id, 'Under_review')}
                disabled={processingId === alert.id}
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/20 transition-all ${processingId === alert.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Investigate"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Audit</span>
              </button>

              <button 
                onClick={() => handleAlertAction(alert.id, 'Resolved')}
                disabled={processingId === alert.id}
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all shadow-lg shadow-emerald-500/5 ${processingId === alert.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Mark Resolved"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Resolve</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


