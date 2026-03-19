import { useState } from 'react';
import { auth } from '../firebase';
import { useStore } from '../store/useStore';
import { 
  Banknote, 
  MapPin, 
  CloudRain, 
  Flame, 
  Users,
  Clock,
  CheckCircle2,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { downloadCSV } from '../utils/exportUtils';

interface PayoutEvent {
  id: string;
  event_type: 'rain' | 'strike' | 'heatwave';
  location: string;
  affected_riders: number;
  total_payout: number;
  status: string;
  timestamp: string;
}

export default function Payouts() {
  const { payouts: events, isLoading, performAction, getUserName } = useStore();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'rain': return <CloudRain className="text-blue-400" />;
      case 'heatwave': return <Flame className="text-orange-400" />;
      default: return <Users className="text-purple-400" />;
    }
  };

  const handleApprove = async (payoutId: string) => {
    setProcessingId(payoutId);
    try {
      await performAction(`/api/payouts/${payoutId}/approve`, 'PATCH');
    } catch (err: any) {
      console.error(err);
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
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by Rider Name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['all', 'Pending', 'Processing', 'Completed', 'Failed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === status 
                    ? 'bg-emerald-500 text-black' 
                    : 'bg-white/5 text-neutral-500 hover:text-white border border-transparent hover:border-white/10'
                }`}
              >
                {status === 'all' ? 'All Payouts' : status}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => downloadCSV(events, 'payouts-report')}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-bold w-fit"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {events
          .filter(p => {
            const name = getUserName(p.userId || p.user_id) || '';
            const matchesSearch = 
              p.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
              name.toLowerCase().includes(searchQuery.toLowerCase());
            
            const currentStatus = (p.status || 'pending').toLowerCase();
            const targetFilter = statusFilter.toLowerCase();
            const matchesStatus = statusFilter === 'all' || currentStatus === targetFilter;
            
            return matchesSearch && matchesStatus;
          })
          .map((payoutItem) => (
          <div 
            key={payoutItem.id} 
            className="bg-[#111111] border border-white/5 p-5 rounded-3xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:border-emerald-500/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                {getEventIcon(payoutItem.event_type || '')}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white capitalize">{getUserName((payoutItem as any).user_id || payoutItem.userId)}</h3>
                <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                  <span className="flex items-center gap-1">{(payoutItem.event_type || 'System')} Event</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {payoutItem.location || 'Remote'}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    {payoutItem.timestamp ? (
                      typeof payoutItem.timestamp === 'string' 
                        ? new Date(payoutItem.timestamp).toLocaleString()
                        : payoutItem.timestamp?.seconds 
                          ? new Date(payoutItem.timestamp.seconds * 1000).toLocaleString()
                          : 'N/A'
                    ) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">Affected Riders</p>
                <p className="text-xl font-bold text-white">1</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">Total Payout</p>
                <p className="text-xl font-bold text-emerald-400">₹{(payoutItem.amount || (payoutItem as any).total_payout || 0).toLocaleString()}</p>
              </div>
              <div className="col-span-2 lg:col-span-1">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">Status</p>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  {payoutItem.status || 'Pending'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {payoutItem.status === 'Processing' && (
                <button 
                  onClick={() => handleApprove(payoutItem.id)}
                  disabled={processingId === payoutItem.id}
                  className={`px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold transition-all ${processingId === payoutItem.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processingId === payoutItem.id ? 'Approving...' : 'Approve Payout'}
                </button>
              )}
              <button 
                onClick={() => setSelectedEvent(payoutItem)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 p-8 rounded-3xl max-w-lg w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Payout details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <p className="text-neutral-500 font-bold uppercase text-[10px]">Rider</p>
                <p className="text-white font-bold">{getUserName((selectedEvent as any).user_id || selectedEvent.userId)}</p>
                
                <p className="text-neutral-500 font-bold uppercase text-[10px]">Payout ID</p>
                <p className="text-white font-mono">{(selectedEvent as any).payout_id || selectedEvent.id}</p>

                <p className="text-neutral-500 font-bold uppercase text-[10px]">Policy ID</p>
                <p className="text-white font-mono">{(selectedEvent as any).policy_id || 'N/A'}</p>

                <p className="text-neutral-500 font-bold uppercase text-[10px]">Event Type</p>
                <p className="text-white capitalize">{selectedEvent.event_type || 'System'}</p>

                <p className="text-neutral-500 font-bold uppercase text-[10px]">Amount</p>
                <p className="text-emerald-400 font-bold text-xl">₹{(selectedEvent.amount || selectedEvent.total_payout || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-neutral-500 font-bold uppercase text-[10px] mb-1">Reason</p>
                <p className="text-neutral-300 text-sm">{(selectedEvent as any).reason || 'Standard disruption payment'}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedEvent(null)}
              className="mt-8 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


