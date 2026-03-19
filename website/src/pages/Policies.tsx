import { useState } from 'react';
import { useStore, Policy } from '../store/useStore';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar,
  IndianRupee,
  Activity
} from 'lucide-react';

export default function Policies() {
  const { policies, riders, isLoading, getUserName } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const filteredPolicies = policies.filter(policy => {
    const user = riders.find(r => r.id === ((policy as any).user_id || (policy as any).userId));
    const userName = user?.emp_name || policy.rider_name || 'Anonymous';
    const city = policy.city || user?.work_location || 'Unknown City';
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      if (date.toDate) return date.toDate().toLocaleDateString();
      const d = new Date(date);
      return d.toString() === 'Invalid Date' ? 'N/A' : d.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Policy Monitoring</h1>
          <p className="text-neutral-500">Verify ML premium engine behavior and coverage.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 w-full sm:w-64 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-1 bg-[#111111] p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar w-full md:w-auto">
            {['all', 'active', 'expired', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-emerald-500 text-black' 
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">User & City</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Premium</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Coverage Limit</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Risk Score</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Validity</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-neutral-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPolicies.map((policy) => {
                const user = riders.find(r => r.id === ((policy as any).user_id || (policy as any).userId));
                return (
                  <tr key={policy.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{user?.emp_name || policy.rider_name || 'Anonymous'}</p>
                      <p className="text-xs text-neutral-500">{policy.city || user?.work_location || 'Unknown City'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-emerald-400 font-bold">
                        <IndianRupee className="w-3 h-3" />
                        {policy.premium}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-300 font-medium">₹{policy.coverage_limit.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${policy.risk_score > 0.7 ? 'text-red-400' : 'text-emerald-400'}`} />
                        <span className="text-sm font-mono text-neutral-400">{policy.risk_score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(policy.coverage_start)} - {formatDate(policy.coverage_end)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        policy.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 
                        policy.status === 'expired' ? 'bg-neutral-500/10 text-neutral-400' : 
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


