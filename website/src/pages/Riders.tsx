import { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useStore } from '../store/useStore';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserX, 
  ShieldAlert, 
  CheckCircle2,
  MapPin,
  Phone,
  Briefcase,
  AlertTriangle,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadCSV } from '../utils/exportUtils';

interface Rider {
  id: string;
  user_id: string;
  phone: string;
  emp_name: string;
  platform: string;
  work_location: string;
  partner_id: string;
  weekly_salary: number;
  risk_score: number;
  status: 'active' | 'under_review' | 'suspended' | 'banned';
}

export default function Riders() {
  const { riders, isLoading, performAction } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  const handleRiderAction = async (riderId: string, newStatus: Rider['status']) => {
    try {
      await performAction(`/api/users/${riderId}/status`, 'PATCH', { status: newStatus });
      setSelectedRider(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const filteredRiders = riders.filter(r => {
    const matchesSearch = 
      (r.emp_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone || '').includes(searchTerm) ||
      (r.partner_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rider Management</h1>
          <p className="text-neutral-500">Monitor and manage gig worker accounts.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 w-full sm:w-80 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#111111] p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
            {['all', 'active', 'under_review', 'suspended', 'banned'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-emerald-500 text-black' 
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button 
            onClick={() => downloadCSV(filteredRiders, 'riders-report')}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-bold w-full sm:w-fit"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="p-3 bg-[#111111] border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors hidden sm:block">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Rider Details</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Platform & ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Location</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Risk</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRiders.map((rider) => (
                <tr key={rider.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-emerald-400 font-bold border border-white/5">
                        {rider.emp_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{rider.emp_name}</p>
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {rider.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-3 h-3 text-neutral-500" />
                      <span className="text-sm text-neutral-300 font-medium">{rider.platform}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-neutral-500 uppercase">{rider.partner_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-neutral-400">
                      <MapPin className="w-3 h-3" /> {rider.work_location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[rider.status]}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      {rider.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[80px] bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${rider.risk_score > 0.7 ? 'bg-red-500' : rider.risk_score > 0.3 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                        style={{ width: `${rider.risk_score * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 block">Score: {rider.risk_score.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedRider(rider)}
                      className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {selectedRider && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRider(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Manage Rider</h3>
              <p className="text-neutral-500 mb-8">Update status for <span className="text-white">{selectedRider.emp_name}</span></p>
              
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => handleRiderAction(selectedRider.id, 'active')}
                  className="flex items-center gap-3 p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all font-bold"
                >
                  <CheckCircle2 className="w-5 h-5" /> Restore / Activate
                </button>
                <button 
                  onClick={() => handleRiderAction(selectedRider.id, 'under_review')}
                  className="flex items-center gap-3 p-4 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-2xl hover:bg-yellow-500/20 transition-all font-bold"
                >
                  <ShieldAlert className="w-5 h-5" /> Mark for Review
                </button>
                <button 
                  onClick={() => handleRiderAction(selectedRider.id, 'suspended')}
                  className="flex items-center gap-3 p-4 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-2xl hover:bg-orange-500/20 transition-all font-bold"
                >
                  <UserX className="w-5 h-5" /> Suspend Account
                </button>
                <button 
                  onClick={() => handleRiderAction(selectedRider.id, 'banned')}
                  className="flex items-center gap-3 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all font-bold"
                >
                  <AlertTriangle className="w-5 h-5" /> Ban Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-400',
  under_review: 'bg-yellow-500/10 text-yellow-400',
  suspended: 'bg-orange-500/10 text-orange-400',
  banned: 'bg-red-500/10 text-red-400',
};

const mockRiders: Rider[] = [];
