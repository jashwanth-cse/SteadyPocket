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
  const { policies, isLoading, getUserName } = useStore();

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Policy Monitoring</h1>
          <p className="text-neutral-500">Verify ML premium engine behavior and coverage.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search policies..."
              className="bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 w-full sm:w-64 transition-all"
            />
          </div>
          <button className="p-3 bg-[#111111] border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
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
              {policies.map((policy) => (
                <tr key={policy.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">{getUserName((policy as any).user_id || (policy as any).userId)}</p>
                    <p className="text-xs text-neutral-500">{policy.city || 'Unknown City'}</p>
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
                      {new Date(policy.coverage_start).toLocaleDateString()} - {new Date(policy.coverage_end).toLocaleDateString()}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


