import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  AlertTriangle,
  CircleGauge,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { useStore } from "../store/useStore";

type FraudUser = {
  name: string;
  risk?: number;
  riskScore: number;
  alerts: number;
  status: string;
  location?: string;
};

type FraudTrendPoint = {
  date?: string;
  label: string;
  value: number;
};

type FraudAnalyticsResponse = {
  fraudRate: number;
  topUsers: FraudUser[];
  fraudTrend?: FraudTrendPoint[];
  trend?: FraudTrendPoint[];
};

const FALLBACK_FRAUD_DATA: FraudAnalyticsResponse = {
  fraudRate: 12,
  topUsers: [
    {
      name: "Rider 1",
      risk: 85,
      riskScore: 85,
      alerts: 5,
      status: "High",
      location: "Chennai",
    },
    {
      name: "Rider 2",
      risk: 78,
      riskScore: 78,
      alerts: 3,
      status: "Elevated",
      location: "Bangalore",
    },
    {
      name: "Rider 3",
      risk: 64,
      riskScore: 64,
      alerts: 2,
      status: "Watchlist",
      location: "Hyderabad",
    },
  ],
  trend: [
    { date: "Mon", label: "Mon", value: 5 },
    { date: "Tue", label: "Tue", value: 8 },
    { date: "Wed", label: "Wed", value: 6 },
    { date: "Thu", label: "Thu", value: 9 },
    { date: "Fri", label: "Fri", value: 7 },
  ],
};

function levelFromRate(rate: number) {
  if (rate >= 25)
    return {
      label: "Critical",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    };
  if (rate >= 12)
    return {
      label: "Elevated",
      className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    };
  return {
    label: "Controlled",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
}

function getStatusChip(status: string, riskScore: number) {
  const normalized = status.toLowerCase();
  if (normalized.includes("ban"))
    return "bg-red-500/10 text-red-400 border-red-500/20";
  if (normalized.includes("susp"))
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  if (riskScore >= 70) return "bg-red-500/10 text-red-400 border-red-500/20";
  if (riskScore >= 40)
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
}

export default function FraudAnalytics() {
  const performAction = useStore((state) => state.performAction);
  const [data, setData] = useState<FraudAnalyticsResponse | null>(
    FALLBACK_FRAUD_DATA,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const loadAnalytics = async () => {
    setIsLoading(true);

    try {
      const response = await performAction("/api/analytics/fraud", "GET");
      const topUsers = Array.isArray(response?.topUsers)
        ? response.topUsers.map((user: any) => ({
            ...user,
            riskScore: Number(user?.riskScore ?? user?.risk ?? 0),
            alerts: Number(user?.alerts ?? 0),
            status:
              user?.status ||
              statusFromRisk(Number(user?.riskScore ?? user?.risk ?? 0)),
          }))
        : FALLBACK_FRAUD_DATA.topUsers;

      const trend = Array.isArray(response?.fraudTrend)
        ? response.fraudTrend
        : Array.isArray(response?.trend)
          ? response.trend
          : FALLBACK_FRAUD_DATA.trend || [];

      setData({
        fraudRate: Number(response?.fraudRate ?? FALLBACK_FRAUD_DATA.fraudRate),
        topUsers: topUsers.length ? topUsers : FALLBACK_FRAUD_DATA.topUsers,
        trend: (trend.length ? trend : FALLBACK_FRAUD_DATA.trend || []).map(
          (point: any) => ({
            label: point?.label || point?.date || "N/A",
            date: point?.date || point?.label || "N/A",
            value: Number(point?.value ?? 0),
          }),
        ),
      });
      setIsUsingFallback(false);
    } catch (err: any) {
      setData(FALLBACK_FRAUD_DATA);
      setIsUsingFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    const interval = window.setInterval(loadAnalytics, 30000);
    return () => window.clearInterval(interval);
  }, [performAction]);

  const fraudRate = data?.fraudRate ?? 0;
  const fraudLevel = useMemo(() => levelFromRate(fraudRate), [fraudRate]);
  const trendData =
    data?.trend || data?.fraudTrend || FALLBACK_FRAUD_DATA.trend || [];
  const topUsers = data?.topUsers || FALLBACK_FRAUD_DATA.topUsers;
  const aiInsight = useMemo(() => {
    const topZone = topUsers[0];
    if (!topZone) return "⚠ Monitoring active. Waiting for more fraud signals.";
    return `⚠ High fraud activity detected in ${topZone.location || topZone.name} region`;
  }, [topUsers]);

  function statusFromRisk(risk: number) {
    if (risk >= 70) return "High";
    if (risk >= 40) return "Medium";
    return "Low";
  }

  if (isLoading) {
    return (
      <div className="bg-[#1e293b]/70 backdrop-blur-xl border border-cyan-500/10 rounded-3xl p-6 space-y-6 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-56 bg-white/5 rounded-lg" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-[340px] bg-white/5 rounded-3xl" />
            <div className="h-[340px] bg-white/5 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1e293b]/70 backdrop-blur-xl border border-cyan-500/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(34,211,238,0.08)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-cyan-300" />
            <h3 className="text-xl font-bold text-white">
              Fraud Analytics Panel
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
              Live Intel
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Real-time fraud signals, suspicious users, and trend analysis.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 border border-white/10 px-3 py-2 rounded-full w-fit">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          AI anomaly scan active
        </div>
      </div>

      {isUsingFallback ? (
        <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          No live data available – showing simulated insights
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">
                  Fraud Rate
                </p>
                <CircleGauge className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#22d3ee ${fraudRate * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                  }}
                />
                <div className="absolute inset-[10px] rounded-full bg-[#0f172a] border border-white/10 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-white">
                    {fraudRate.toFixed(1)}%
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">
                    claims
                  </span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${fraudLevel.className}`}
                >
                  {fraudLevel.label}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-3">
                AI Insight
              </p>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{aiInsight}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    The system cross-checks fraud alerts, payout volume, and
                    rider risk to detect emerging anomalies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white">
                  Top Suspicious Users
                </h4>
                <p className="text-xs text-slate-500">
                  Highest combined fraud alert count and risk score
                </p>
              </div>
              <Users className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[520px]">
                <thead className="bg-black/10">
                  <tr className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                    <th className="px-5 py-3 font-bold">Name</th>
                    <th className="px-5 py-3 font-bold">Risk Score</th>
                    <th className="px-5 py-3 font-bold">Alerts</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topUsers.map((user, index) => {
                    const riskScore = Number(user.riskScore ?? user.risk ?? 0);
                    const status = user.status || statusFromRisk(riskScore);
                    return (
                      <tr
                        key={`${user.name}-${index}`}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {user.location || "Unknown location"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-24 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${riskScore >= 70 ? "bg-red-400" : riskScore >= 40 ? "bg-yellow-400" : "bg-cyan-400"}`}
                                style={{
                                  width: `${Math.min(100, riskScore)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-white tabular-nums">
                              {riskScore.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-300 font-semibold">
                          {user.alerts}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusChip(status, riskScore)}`}
                          >
                            {status}
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

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-base font-bold text-white">
                Fraud Trends Graph
              </h4>
              <p className="text-xs text-slate-500">
                Daily alert volume across the last two weeks
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-300 font-bold">
              Recharts
            </span>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 18, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id="fraudTrendStroke"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#cbd5e1" }}
                  itemStyle={{ color: "#22d3ee" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#fraudTrendStroke)"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#22d3ee" }}
                  activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {topUsers.length ? (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topUsers.slice(0, 3).map((user) => (
            <div
              key={`${user.name}-summary`}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                  Signal
                </p>
                <p className="text-sm text-white font-semibold truncate max-w-[160px]">
                  {user.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Alerts
                </p>
                <p className="text-base font-black text-cyan-300">
                  {user.alerts}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}
