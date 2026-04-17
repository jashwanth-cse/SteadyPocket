import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Brain,
  CircleGauge,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "../store/useStore";

type RiskLevel = "Low" | "Medium" | "High";

type FraudUser = {
  id?: string;
  name: string;
  risk?: number;
  riskScore?: number;
  alerts: number;
  status?: string;
  location?: string;
};

type FraudPoint = {
  date?: string;
  label: string;
  value: number;
};

type FraudResponse = {
  fraudRate?: number;
  topUsers?: FraudUser[];
  fraudTrend?: FraudPoint[];
  trend?: FraudPoint[];
};

type Zone = {
  location: string;
  avgRisk: number;
  riders: number;
  alerts: number;
  score: number;
  level: RiskLevel;
};

type PredictionsResponse = {
  nextWeekRisk?: number;
  highRiskZones?: string[];
  expectedClaims?: number;
  nextWeekRiskDetails?: {
    score: number;
    level: RiskLevel;
    breakdown: {
      weather: number;
      location: number;
      pastClaims: number;
      activity: number;
    };
  };
  highRiskZoneDetails?: Zone[];
  expectedClaimsDetails?: {
    count: number;
    baseline: number;
    changePercent: number;
    direction: "up" | "down" | "flat";
  };
};

type DashboardAlert = {
  id: string;
  userId?: string;
  user_id?: string;
  rider_name?: string;
  risk_score?: number;
  status?: string;
  timestamp?: any;
  created_at?: any;
  updated_at?: any;
  location?: string;
  work_location?: string;
};

type DashboardPayout = {
  id: string;
  userId?: string;
  user_id?: string;
  amount?: number;
  total_payout?: number;
  timestamp?: any;
  created_at?: any;
  processed_at?: any;
  status?: string;
};

type DashboardRider = {
  id: string;
  emp_name?: string;
  name?: string;
  work_location?: string;
  location?: string;
  status?: string;
  risk_score?: number;
};

function levelClass(level: RiskLevel) {
  if (level === "High") return "bg-red-500/10 text-red-400 border-red-500/20";
  if (level === "Medium")
    return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
}

function levelFromRate(rate: number): RiskLevel {
  if (rate >= 25) return "High";
  if (rate >= 12) return "Medium";
  return "Low";
}

function toDate(value: any) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getRecordDate(record: any) {
  return (
    toDate(record?.timestamp) ||
    toDate(record?.created_at) ||
    toDate(record?.processed_at) ||
    toDate(record?.updated_at)
  );
}

function riderName(rider?: DashboardRider) {
  return rider?.emp_name || rider?.name || "Anonymous";
}

function riderLocation(rider?: DashboardRider) {
  return rider?.work_location || rider?.location || "Unknown";
}

function normalizeLocation(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function matchesLocation(selectedLocation: string, candidate?: string) {
  if (selectedLocation === "all") return true;
  return normalizeLocation(candidate) === normalizeLocation(selectedLocation);
}

function alertStatus(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (["resolved", "ignored", "completed"].includes(normalized))
    return "closed";
  if (["investigating", "under_review", "action_required"].includes(normalized))
    return "open";
  return "pending";
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function alertCountForUser(
  alerts: DashboardAlert[],
  userId: string,
  name?: string,
) {
  const lowerName = String(name || "").toLowerCase();
  return alerts.filter((alert) => {
    const matchesId =
      String(alert.userId || alert.user_id || "").toLowerCase() ===
      String(userId).toLowerCase();
    const matchesName =
      lowerName && String(alert.rider_name || "").toLowerCase() === lowerName;
    return matchesId || matchesName;
  }).length;
}

function getUserIdFromAlert(alert: DashboardAlert) {
  return String(alert.userId || alert.user_id || alert.id || "");
}

function getAlertLocation(alert: DashboardAlert, rider?: DashboardRider) {
  return (
    alert.location || alert.work_location || riderLocation(rider) || "Unknown"
  );
}

function buildLocationOptions(
  riders: DashboardRider[],
  alerts: DashboardAlert[],
) {
  const locations = new Set<string>();

  riders.forEach((rider) => {
    const location = riderLocation(rider);
    if (location && location !== "Unknown") locations.add(location);
  });

  alerts.forEach((alert) => {
    const location = alert.location || alert.work_location;
    if (location && location !== "Unknown") locations.add(location);
  });

  return ["all", ...Array.from(locations).sort((a, b) => a.localeCompare(b))];
}

function withinRange(date: Date | null, start: Date, end: Date) {
  if (!date) return false;
  return date >= start && date <= end;
}

function countByDay(records: Array<{ date: Date | null }>, days = 14) {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date(end));
  start.setDate(start.getDate() - (days - 1));

  return Array.from({ length: days }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const dayStart = startOfDay(current);
    const dayEnd = endOfDay(current);

    return {
      label: current.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      date: current.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: records.filter((record) =>
        withinRange(record.date, dayStart, dayEnd),
      ).length,
    };
  });
}

function buildTopUsers(riders: DashboardRider[], alerts: DashboardAlert[]) {
  const rankedFromRiders = riders.map((rider) => {
    const id = rider.id;
    const alertsCount = alertCountForUser(alerts, id, riderName(rider));
    const riskScore = clamp(
      Number(rider.risk_score ?? 0) * 100 * 0.7 + alertsCount * 8,
    );

    return {
      id,
      name: riderName(rider),
      risk: Number(riskScore.toFixed(1)),
      riskScore: Number(riskScore.toFixed(1)),
      alerts: alertsCount,
      status: rider.status || levelFromScore(riskScore),
      location: riderLocation(rider),
    } satisfies FraudUser;
  });

  const alertOnlyUsers = alerts
    .filter((alert) => !alert.userId && !alert.user_id && alert.rider_name)
    .map((alert) => {
      const alertsCount = alerts.filter(
        (other) => other.rider_name && other.rider_name === alert.rider_name,
      ).length;
      const riderRisk = Number(alert.risk_score ?? 0) * 100;
      const riskScore = clamp(riderRisk * 0.7 + alertsCount * 8);
      return {
        id: alert.id,
        name: alert.rider_name || "Anonymous",
        risk: Number(riskScore.toFixed(1)),
        riskScore: Number(riskScore.toFixed(1)),
        alerts: alertsCount,
        status: levelFromScore(riskScore),
        location: getAlertLocation(alert),
      } satisfies FraudUser;
    });

  return [...rankedFromRiders, ...alertOnlyUsers]
    .sort((a, b) => b.alerts - a.alerts || b.riskScore - a.riskScore)
    .slice(0, 4);
}

function buildRiskZones(riders: DashboardRider[], alerts: DashboardAlert[]) {
  const buckets = new Map<
    string,
    { location: string; riders: number; alerts: number; totalRisk: number }
  >();

  riders.forEach((rider) => {
    const location = riderLocation(rider);
    const bucket = buckets.get(location) || {
      location,
      riders: 0,
      alerts: 0,
      totalRisk: 0,
    };
    bucket.riders += 1;
    bucket.totalRisk += Number(rider.risk_score ?? 0) * 100;
    buckets.set(location, bucket);
  });

  alerts.forEach((alert) => {
    const rider = riders.find(
      (item) =>
        String(item.id).toLowerCase() ===
          String(alert.userId || alert.user_id || "").toLowerCase() ||
        riderName(item).toLowerCase() ===
          String(alert.rider_name || "").toLowerCase(),
    );
    const location = getAlertLocation(alert, rider);
    const bucket = buckets.get(location) || {
      location,
      riders: 0,
      alerts: 0,
      totalRisk: 0,
    };
    bucket.alerts += 1;
    if (rider) {
      bucket.totalRisk += Number(rider.risk_score ?? 0) * 100;
      if (!bucket.riders) bucket.riders = 1;
    }
    buckets.set(location, bucket);
  });

  return [...buckets.values()]
    .map((bucket) => {
      const avgRisk = bucket.riders
        ? bucket.totalRisk / bucket.riders
        : bucket.alerts * 10;
      const score = clamp(avgRisk * 0.68 + bucket.alerts * 5);
      return {
        location: bucket.location,
        avgRisk: Number(avgRisk.toFixed(1)),
        riders: bucket.riders,
        alerts: bucket.alerts,
        score: Number(score.toFixed(1)),
        level: levelFromScore(score),
      } satisfies Zone;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function buildPredictions(
  riders: DashboardRider[],
  alerts: DashboardAlert[],
  payouts: DashboardPayout[],
) {
  const now = new Date();
  const last7Start = startOfDay(new Date(now));
  last7Start.setDate(last7Start.getDate() - 6);
  const prev7End = new Date(last7Start);
  prev7End.setDate(prev7End.getDate() - 1);
  const prev7Start = startOfDay(new Date(prev7End));
  prev7Start.setDate(prev7Start.getDate() - 6);

  const recentAlerts = alerts.filter((alert) =>
    withinRange(getRecordDate(alert), last7Start, endOfDay(now)),
  );
  const previousAlerts = alerts.filter((alert) =>
    withinRange(getRecordDate(alert), prev7Start, endOfDay(prev7End)),
  );

  const recentPayouts = payouts.filter((payout) =>
    withinRange(getRecordDate(payout), last7Start, endOfDay(now)),
  );
  const previousPayouts = payouts.filter((payout) =>
    withinRange(getRecordDate(payout), prev7Start, endOfDay(prev7End)),
  );

  const claimsCount = recentPayouts.length || recentAlerts.length;
  const baseline = previousPayouts.length || previousAlerts.length || 1;
  const changePercent = Number(
    (((claimsCount - baseline) / Math.max(1, baseline)) * 100).toFixed(1),
  );

  const highRiskZoneDetails = buildRiskZones(riders, alerts);
  const topRiskScore = highRiskZoneDetails[0]?.score ?? 0;
  const nextWeekRiskScore = clamp(
    topRiskScore * 0.45 +
      (recentAlerts.length / Math.max(1, riders.length)) * 20 +
      Math.abs(changePercent) * 0.9,
  );

  const weatherRisk = clamp(
    recentAlerts.filter((alert) =>
      /weather|rain|storm|flood|heatwave/i.test(
        `${alert.status || ""} ${alert.rider_name || ""}`,
      ),
    ).length * 12,
  );
  const locationRisk = highRiskZoneDetails[0]?.score ?? 0;
  const pastClaimsRisk = clamp(claimsCount * 4 + recentAlerts.length * 3);
  const activityRisk = clamp(
    (recentAlerts.length / Math.max(1, riders.length)) * 100,
  );

  const nextWeekRiskDetails = {
    score: Number(nextWeekRiskScore.toFixed(1)),
    level: levelFromScore(nextWeekRiskScore),
    breakdown: {
      weather: Number(weatherRisk.toFixed(1)),
      location: Number(locationRisk.toFixed(1)),
      pastClaims: Number(pastClaimsRisk.toFixed(1)),
      activity: Number(activityRisk.toFixed(1)),
    },
  };

  return {
    nextWeekRisk: nextWeekRiskDetails.score,
    highRiskZones: highRiskZoneDetails.map((zone) => zone.location),
    expectedClaims: claimsCount,
    nextWeekRiskDetails,
    highRiskZoneDetails,
    expectedClaimsDetails: {
      count: claimsCount,
      baseline,
      changePercent,
      direction:
        changePercent > 0
          ? ("up" as const)
          : changePercent < 0
            ? ("down" as const)
            : ("flat" as const),
    },
  } satisfies Required<PredictionsResponse>;
}

export default function Analytics() {
  const riders = useStore((state) => state.riders) as DashboardRider[];
  const payouts = useStore((state) => state.payouts) as DashboardPayout[];
  const alerts = useStore((state) => state.alerts) as DashboardAlert[];
  const isLoading = useStore((state) => state.isLoading);
  const [selectedLocation, setSelectedLocation] = useState("all");

  const locationOptions = useMemo(
    () => buildLocationOptions(riders, alerts),
    [alerts, riders],
  );

  const derived = useMemo(() => {
    const riderMap = new Map<string, DashboardRider>();
    riders.forEach((rider) => riderMap.set(rider.id, rider));

    const filteredRiders =
      selectedLocation === "all"
        ? riders
        : riders.filter((rider) =>
            matchesLocation(selectedLocation, riderLocation(rider)),
          );

    const locationFilteredAlerts =
      selectedLocation === "all"
        ? alerts
        : alerts.filter((alert) => {
            const linkedRider = riderMap.get(
              String(alert.userId || alert.user_id || ""),
            );
            return matchesLocation(
              selectedLocation,
              getAlertLocation(alert, linkedRider),
            );
          });

    const locationFilteredPayouts =
      selectedLocation === "all"
        ? payouts
        : payouts.filter((payout) => {
            const linkedRider = riderMap.get(
              String(payout.userId || payout.user_id || ""),
            );
            return matchesLocation(
              selectedLocation,
              riderLocation(linkedRider),
            );
          });

    const recentAlerts = locationFilteredAlerts.filter((alert) =>
      withinRange(
        getRecordDate(alert),
        startOfDay(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)),
        endOfDay(new Date()),
      ),
    );

    const trend = countByDay(
      locationFilteredAlerts.map((alert) => ({ date: getRecordDate(alert) })),
      14,
    );

    const topUsers = buildTopUsers(filteredRiders, locationFilteredAlerts);
    const highRiskZoneDetails = buildRiskZones(
      filteredRiders,
      locationFilteredAlerts,
    );
    const predictions = buildPredictions(
      filteredRiders,
      locationFilteredAlerts,
      locationFilteredPayouts,
    );

    const fraudRate = Number(
      (
        (recentAlerts.filter((alert) => alertStatus(alert.status) !== "closed")
          .length /
          Math.max(
            1,
            filteredRiders.length ||
              locationFilteredPayouts.length ||
              locationFilteredAlerts.length,
          )) *
        100
      ).toFixed(1),
    );

    const riskScore = predictions.nextWeekRiskDetails.score;
    const riskLevel = predictions.nextWeekRiskDetails.level;
    const topZone =
      highRiskZoneDetails[0]?.location ||
      filteredRiders[0]?.work_location ||
      filteredRiders[0]?.location ||
      "Unknown";

    const aiInsight = topUsers[0]
      ? `⚠ ${topUsers[0].name} has the highest alert activity in ${topZone} region`
      : `⚠ Monitoring live fraud activity in ${topZone} region`;

    return {
      fraudRate,
      riskScore,
      riskLevel,
      trend,
      topUsers,
      highRiskZoneDetails,
      predictions,
      aiInsight,
      topZone,
    };
  }, [alerts, payouts, riders, selectedLocation]);

  const fraudRate = derived.fraudRate;
  const riskScore = derived.riskScore;
  const riskLevel = derived.riskLevel;
  const trendData = derived.trend;
  const topUsers = derived.topUsers;
  const predictions = derived.predictions;
  const topZone = derived.topZone;
  const aiInsight = derived.aiInsight;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-56 rounded-3xl bg-[#111111] animate-pulse border border-white/5" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="h-72 rounded-3xl bg-[#111111] animate-pulse border border-white/5" />
          <div className="h-72 rounded-3xl bg-[#111111] animate-pulse border border-white/5" />
          <div className="h-72 rounded-3xl bg-[#111111] animate-pulse border border-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Analytics</h1>
          <p className="text-neutral-500">
            Premium AI control system for fraud and predictive intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#111111] border border-white/5 px-4 py-2.5 rounded-2xl">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
          </span>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            LIVE AI ENGINE
          </span>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/5 bg-[#111111] p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-bold mb-2">
              Insurance AI Score
            </p>
            <p className="text-4xl lg:text-5xl font-bold text-white leading-none">
              {riskScore}
            </p>
            <p
              className={`mt-3 inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${levelClass(riskLevel)}`}
            >
              {riskLevel} Risk
            </p>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-bold mb-2">
              Key Insight
            </p>
            <p className="text-2xl font-bold text-white leading-snug">
              {aiInsight}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Signals are refreshed in real time from Firestore-backed users,
              fraud alerts, payouts, and policy records.
            </p>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 uppercase tracking-widest font-bold">
                Fraud Rate
              </span>
              <span
                className={`font-bold ${levelFromRate(fraudRate) === "High" ? "text-red-400" : levelFromRate(fraudRate) === "Medium" ? "text-yellow-300" : "text-emerald-400"}`}
              >
                {fraudRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 uppercase tracking-widest font-bold">
                7-Day Claims
              </span>
              <span className="font-bold text-white">
                {predictions.expectedClaimsDetails.count}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 uppercase tracking-widest font-bold">
                Hot Zones
              </span>
              <span className="font-bold text-yellow-300">
                {predictions.highRiskZoneDetails.length}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> Active Monitoring
            </span>
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/5 bg-[#111111] p-5 hover:bg-white/[0.02] transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Location Filter</h3>
          <MapPin className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold">
            Location
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
            <MapPin className="w-4 h-4 text-yellow-300" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white outline-none border-none focus:ring-0"
            >
              {locationOptions.map((location) => (
                <option
                  key={location}
                  value={location}
                  className="bg-[#111111]"
                >
                  {location === "all" ? "All Locations" : location}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-2 text-xs text-neutral-400">
            Showing live fraud and prediction signals for the selected location.
          </p>
        </div>
      </motion.div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Fraud Intelligence
          </h2>
          <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            Realtime
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-3xl border border-white/5 bg-[#111111] p-5 hover:bg-white/[0.02] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold">
                Fraud Rate
              </p>
              <CircleGauge className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="relative flex items-center justify-center w-28 h-28 mx-auto">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#10b981 ${fraudRate * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                }}
              />
              <div className="absolute inset-[10px] rounded-full bg-black/30 border border-white/10 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">
                  {fraudRate.toFixed(1)}%
                </span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                  claims
                </span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${levelClass(levelFromRate(fraudRate))}`}
              >
                {levelFromRate(fraudRate)}
              </span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-3xl border border-white/5 bg-[#111111] p-5 hover:bg-white/[0.02] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Top Suspicious Users
              </h3>
              <Users className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="space-y-2.5">
              {topUsers.slice(0, 4).map((user, index) => {
                const score = Number(user.riskScore ?? user.risk ?? 0);
                return (
                  <div
                    key={`${user.name}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.name}
                      </p>
                      <span className="text-xs text-red-400 font-bold">
                        {user.alerts} alerts
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${score >= 70 ? "bg-red-400" : score >= 40 ? "bg-yellow-400" : "bg-emerald-400"}`}
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-3xl border border-white/5 bg-[#111111] p-5 hover:bg-white/[0.02] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Fraud Trends</h3>
              <TrendingUp className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                >
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
                      backgroundColor: "#111111",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#cbd5e1" }}
                    itemStyle={{ color: "#10b981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 2.5, fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Predictive Intelligence
          </h2>
          <span className="text-[10px] uppercase tracking-widest text-yellow-300 font-bold bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
            Next 7 Days
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-3xl border border-white/5 bg-[#111111] p-5 hover:bg-white/[0.02] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Risk Score</h3>
              <Brain className="w-4 h-4 text-neutral-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {predictions.nextWeekRiskDetails.score.toFixed(1)}
            </p>
            <p className="text-sm mt-2 text-neutral-400">
              Forecast risk level for the coming week.
            </p>
            <span
              className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${levelClass(predictions.nextWeekRiskDetails.level)}`}
            >
              {predictions.nextWeekRiskDetails.level} Risk
            </span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="xl:col-span-2 rounded-3xl border border-white/5 bg-[#111111] p-6 hover:bg-white/[0.02] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  High Risk Zones
                </h3>
                <p className="text-xs text-slate-400">
                  Location clusters requiring immediate attention
                </p>
              </div>
              <MapPin className="w-4 h-4 text-neutral-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predictions.highRiskZoneDetails.map((zone, index) => (
                <div
                  key={`${zone.location}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {zone.location}
                      </p>
                      <p className="text-xs text-slate-500">
                        {zone.riders} riders • {zone.alerts} alerts
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${levelClass(zone.level)}`}
                    >
                      {zone.level}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${zone.level === "High" ? "bg-red-500" : zone.level === "Medium" ? "bg-yellow-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, zone.score)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>Avg risk {zone.avgRisk.toFixed(1)}</span>
                    <span className="font-bold text-white">
                      Score {zone.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
