import { useState, useMemo, useEffect } from 'react';
import { db } from '../firebase';
import { useStore } from '../store/useStore';
import { 
  Users, 
  ShieldCheck, 
  Banknote, 
  AlertTriangle, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';



export default function Dashboard() {
  const getStats = useStore((state) => state.getStats);
  const stats = getStats();
  const isLoading = useStore((state) => state.isLoading);
  const timeRange = useStore((state) => state.timeRange);
  const setTimeRange = useStore((state) => state.setTimeRange);
  const customDateRange = useStore((state) => state.customDateRange);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Fail-safe and Mount-check
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300); // Small delay to let layout stabilize
    return () => clearTimeout(timer);
  }, []);

  const payouts = useStore((state) => state.payouts);
  const policies = useStore((state) => state.policies);

  // Memoized Chart Data Generation
  const chartData = useMemo(() => {
    let days = 1;
    let startDate = new Date();
    
    if (timeRange === 'today') {
      days = 1;
      startDate.setHours(0,0,0,0);
    } else if (timeRange === 'yesterday') {
      days = 1;
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0,0,0,0);
    } else if (timeRange === 'custom' && customDateRange.start) {
      const start = new Date(customDateRange.start);
      const end = customDateRange.end ? new Date(customDateRange.end) : new Date();
      days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      startDate = start;
    } else {
      const lookback = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      startDate.setDate(new Date().getDate() - (lookback - 1));
      startDate.setHours(0,0,0,0);
      days = lookback;
    }

    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const dayStart = new Date(d);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23,59,59,999);
      
      const dayPayouts = payouts.filter(p => {
        const ts = p.timestamp?.toDate ? p.timestamp.toDate() : new Date(p.timestamp || 0);
        return ts >= dayStart && ts <= dayEnd;
      });

      const dayPremium = policies.filter(p => {
        const pDate = new Date(p.coverage_start || 0);
        return pDate >= dayStart && pDate <= dayEnd;
      }).reduce((sum, p) => sum + (p.premium || 0), 0);

      result.push({
        name: days === 1 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : dateStr,
        premium: dayPremium,
        payouts: dayPayouts.reduce((sum, p) => sum + (p.amount || (p as any).total_payout || 0), 0)
      });
    }
    return result;
  }, [timeRange, customDateRange, payouts, policies]);

  const statCards = [
    { label: 'Total Riders', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'emerald', trend: '+12%' },
    { label: 'Active Policies', value: stats.activeUsers.toLocaleString(), icon: ShieldCheck, color: 'blue', trend: '+5%' },
    { label: 'Affected Riders', value: stats.affectedRiders.toLocaleString(), icon: Users, color: 'purple', trend: '+18%' },
    { label: 'Total Payouts', value: `₹${stats.totalPayoutAmount.toLocaleString()}`, icon: Banknote, color: 'orange', trend: '-2%' },
    { label: 'Fraud Alerts', value: stats.fraudAlerts.toLocaleString(), icon: AlertTriangle, color: 'red', trend: '+1' },
  ];

  const riders = useStore((state) => state.riders);

  // Fallback if data is totally missing
  const isDataEmpty = riders.length === 0 && !isLoading;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
          <p className="text-neutral-500">Real-time monitoring of Steady Pocket ecosystem.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex gap-1 bg-[#111111] p-1 rounded-2xl border border-white/5 shadow-inner overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'today', label: 'Today' },
              { id: '24h', label: '24h' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: '7d' },
              { id: '30d', label: '30d' }
            ].map((range) => (
              <button 
                key={range.id}
                onClick={() => {
                  setTimeRange(range.id as any);
                  setShowCustomRange(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                  timeRange === range.id 
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {range.label}
              </button>
            ))}
            <button 
              onClick={() => setShowCustomRange(!showCustomRange)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                timeRange === 'custom' || showCustomRange
                  ? 'bg-white/10 text-white border border-white/10' 
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              Custom
            </button>
          </div>
          
          <AnimatePresence>
            {showCustomRange && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 bg-[#111111] p-1 rounded-2xl border border-white/5"
              >
                <input 
                  type="date" 
                  className="bg-transparent border-none text-white text-xs p-2 focus:ring-0 active:ring-0"
                  value={customDateRange.start || ''}
                  onChange={(e) => setTimeRange('custom', { ...customDateRange, start: e.target.value })}
                />
                <span className="text-neutral-600 text-xs">-</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none text-white text-xs p-2 focus:ring-0 active:ring-0"
                  value={customDateRange.end || ''}
                  onChange={(e) => setTimeRange('custom', { ...customDateRange, end: e.target.value })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {isLoading && riders.length === 0 ? (
          [1,2,3,4,5].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />)
        ) : (
          statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#111111] border border-white/5 p-6 rounded-3xl relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500`} />
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.trend}
                  {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
              </div>
              <p className="text-neutral-500 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Premium Revenue Trend</h3>
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Weekly Growth</p>
          </div>
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            {isReady && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="premium" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPremium)" 
                />
              </AreaChart>
            </ResponsiveContainer>
           )}
          </div>
        </div>

        <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Payout Distribution</h3>
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">By Disruption Type</p>
          </div>
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            {isReady && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                />
                <Bar dataKey="payouts" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           )}
          </div>
        </div>
      </div>
    </div>
  );
}
