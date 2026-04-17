import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Banknote,
  MapPin,
  Sparkles,
  Users,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { useStore } from "../store/useStore";

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

type PlannerRegion = {
  location: string;
  users: number;
  risk: RiskLevel;
  probability: number;
  expectedClaims: number;
  estimatedPayout: number;
  avgPayoutAmount?: number;
  reason?: string;
  expectedImpact?: string;
  riskScore?: number;
  source?: string;
};

type PlannerResponse = {
  regions: PlannerRegion[];
  totalRegionsAtRisk?: number;
  totalEstimatedPayoutNeeded?: number;
  aiInsight?: string;
  fallbackUsed?: boolean;
};

const FALLBACK_REGIONS: PlannerRegion[] = [
  {
    location: "Chennai",
    users: 120,
    risk: "HIGH",
    probability: 0.72,
    expectedClaims: 42,
    estimatedPayout: 42000,
    avgPayoutAmount: 1000,
    reason: "Monsoon season approaching",
    expectedImpact: "High disruption in delivery operations",
    riskScore: 72,
    source: "simulated",
  },
  {
    location: "Bangalore",
    users: 95,
    risk: "MEDIUM",
    probability: 0.48,
    expectedClaims: 23,
    estimatedPayout: 23000,
    avgPayoutAmount: 1000,
    reason: "Unstable rainfall pattern",
    expectedImpact: "Moderate rider interruptions with payout pressure",
    riskScore: 48,
    source: "simulated",
  },
  {
    location: "Coimbatore",
    users: 80,
    risk: "LOW",
    probability: 0.28,
    expectedClaims: 11,
    estimatedPayout: 11000,
    avgPayoutAmount: 1000,
    reason: "Lower seasonal disruption compared with coastal regions",
    expectedImpact: "Low but measurable payout exposure",
    riskScore: 28,
    source: "simulated",
  },
];

function levelClass(level: RiskLevel) {
  if (level === "HIGH") return "bg-red-500/10 text-red-400 border-red-500/20";
  if (level === "MEDIUM")
    return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
}

function levelBar(level: RiskLevel) {
  if (level === "HIGH") return "bg-red-500";
  if (level === "MEDIUM") return "bg-yellow-400";
  return "bg-emerald-400";
}

function levelLabel(level: RiskLevel) {
  if (level === "HIGH") return "High";
  if (level === "MEDIUM") return "Medium";
  return "Low";
}

function normalizeRiskLevel(value?: string): RiskLevel {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "HIGH") return "HIGH";
  if (normalized === "LOW") return "LOW";
  return "MEDIUM";
}

export default function PredictivePayoutPlanner() {
  const performAction = useStore((state) => state.performAction);
  const [data, setData] = useState<PlannerResponse>({ regions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [budgetPrepared, setBudgetPrepared] = useState(false);

  const loadPrediction = async () => {
    setIsLoading(true);

    try {
      const response = await performAction("/api/payout/prediction", "GET");
      const regions = Array.isArray(response?.regions)
        ? (response.regions as PlannerRegion[])
        : [];
      const normalizedRegions = (
        regions.length ? regions : FALLBACK_REGIONS
      ).map((region) => ({
        ...region,
        risk: normalizeRiskLevel(region?.risk),
        users: Number(region?.users || 0),
        probability: Math.max(0, Math.min(1, Number(region?.probability || 0))),
        expectedClaims: Number(region?.expectedClaims || 0),
        estimatedPayout: Number(region?.estimatedPayout || 0),
        avgPayoutAmount: Number(region?.avgPayoutAmount || 0),
      }));

      const fallbackApplied =
        !regions.length ||
        Boolean(response?.fallbackUsed) ||
        normalizedRegions.some((region) => region.source === "simulated");

      setData({
        ...response,
        regions: normalizedRegions,
        totalRegionsAtRisk:
          response?.totalRegionsAtRisk ?? normalizedRegions.length,
        totalEstimatedPayoutNeeded:
          response?.totalEstimatedPayoutNeeded ??
          normalizedRegions.reduce(
            (sum: number, region: PlannerRegion) =>
              sum + region.estimatedPayout,
            0,
          ),
        aiInsight:
          response?.aiInsight ||
          `High rainfall expected in ${normalizedRegions[0].location} region`,
      });
      setIsFallback(fallbackApplied);
    } catch {
      setData({
        regions: FALLBACK_REGIONS,
        totalRegionsAtRisk: FALLBACK_REGIONS.length,
        totalEstimatedPayoutNeeded: FALLBACK_REGIONS.reduce(
          (sum, region) => sum + region.estimatedPayout,
          0,
        ),
        aiInsight: `High rainfall expected in ${FALLBACK_REGIONS[0].location} region`,
      });
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrediction();
    const interval = window.setInterval(loadPrediction, 60000);
    return () => window.clearInterval(interval);
  }, [performAction]);

  const regions: PlannerRegion[] = data.regions || [];
  const totalRegions = data.totalRegionsAtRisk ?? regions.length;
  const totalEstimatedPayout =
    data.totalEstimatedPayoutNeeded ??
    regions.reduce(
      (sum: number, region: PlannerRegion) => sum + region.estimatedPayout,
      0,
    );
  const aiInsight =
    data.aiInsight || "Predictive payout planning is warming up.";
  const displayRegions: PlannerRegion[] = regions.length
    ? regions
    : FALLBACK_REGIONS;
  const maxRisk = Math.max(
    ...displayRegions.map((region: PlannerRegion) => region.probability),
    0.01,
  );

  const summaryCards = useMemo(
    () => [
      {
        label: "Regions at risk",
        value: totalRegions.toLocaleString(),
      },
      {
        label: "Estimated payout needed",
        value: `₹${totalEstimatedPayout.toLocaleString()}`,
      },
      {
        label: "Verified workers covered",
        value: regions
          .reduce((sum: number, region: PlannerRegion) => sum + region.users, 0)
          .toLocaleString(),
      },
    ],
    [regions, totalEstimatedPayout, totalRegions],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-52 rounded-xl bg-[#111111] animate-pulse border border-white/5" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="h-64 rounded-xl bg-[#111111] animate-pulse border border-white/5" />
          <div className="h-64 rounded-xl bg-[#111111] animate-pulse border border-white/5" />
          <div className="h-64 rounded-xl bg-[#111111] animate-pulse border border-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isFallback ? (
        <div className="rounded-xl border border-white/5 bg-[#020617] px-4 py-3 text-sm text-neutral-400 shadow-[0_0_20px_rgba(16,185,129,0.06)]">
          No live prediction – using simulated data
        </div>
      ) : null}

      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/5 bg-[#020617] p-6 shadow-[0_0_30px_rgba(16,185,129,0.06)]"
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-5 h-5 text-emerald-400" />
              <h1 className="text-3xl font-bold text-white">
                Predictive Payout Planning
              </h1>
            </div>
            <p className="text-neutral-500 max-w-2xl">
              AI-assisted reserve planning for weather disruptions and
              gig-worker payout exposure.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#111111] border border-white/5 px-4 py-2.5 rounded-xl w-fit">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              LIVE RISK PLANNER
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-white/5 bg-[#111111] p-4"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mb-2">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mb-1">
                AI Insight
              </p>
              <p className="text-lg font-bold text-white leading-snug">
                {aiInsight}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Predictive reserves help prepare budgets before disruptions hit.
              </p>
            </div>
          </div>

          <button
            onClick={() => setBudgetPrepared(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-all"
          >
            <Wallet className="w-4 h-4" />
            Allocate Budget
          </button>
          {budgetPrepared ? (
            <p className="mt-3 text-xs text-emerald-400 font-medium">
              Budget allocation staged for finance review.
            </p>
          ) : null}
        </div>
      </motion.section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Region Forecasts</h2>
          <span className="text-[10px] uppercase tracking-widest text-yellow-300 font-bold bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
            Next 30 Days
          </span>
        </div>

        {displayRegions.length ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {displayRegions.map((region) => (
              <motion.div
                key={region.location}
                whileHover={{ scale: 1.01 }}
                className="rounded-xl border border-white/5 bg-[#020617] p-5 shadow-[0_0_20px_rgba(16,185,129,0.04)]"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {region.location}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Verified workers in region
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${levelClass(region.risk)}`}
                  >
                    {levelLabel(region.risk)} Risk
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mb-1">
                      Users
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {region.users}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mb-1">
                      Expected Claims
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {region.expectedClaims}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mb-1">
                      Probability
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(region.probability * 100)}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mb-1">
                      Estimated Payout
                    </p>
                    <p className="text-2xl font-bold text-emerald-400">
                      ₹{region.estimatedPayout.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-neutral-500 uppercase tracking-widest font-bold">
                      Risk Progress
                    </span>
                    <span className="text-white font-bold">
                      {Math.round(region.probability * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${levelBar(region.risk)}`}
                      style={{
                        width: `${Math.min(100, (region.probability / maxRisk) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-neutral-400">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-yellow-300 shrink-0" />
                    <span>
                      {region.reason || "Seasonal disruption risk detected"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-red-400 shrink-0" />
                    <span>
                      {region.expectedImpact ||
                        "Potential payout pressure for verified workers"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                    <span>
                      Avg payout per claim: ₹
                      {Math.round(region.avgPayoutAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-[#020617] p-6 text-neutral-500">
            No fully verified workers found yet.
          </div>
        )}
      </section>
    </div>
  );
}
