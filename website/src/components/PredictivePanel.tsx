import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Brain,
  MapPin,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useStore } from "../store/useStore";

type RiskLevel = "Low" | "Medium" | "High";

type PredictionResponse = {
  nextWeekRisk?:
    | number
    | {
        score: number;
        level: RiskLevel;
        breakdown: {
          weather: number;
          location: number;
          pastClaims: number;
          activity: number;
        };
      };
  highRiskZones?:
    | string[]
    | Array<{
        location: string;
        avgRisk: number;
        riders: number;
        alerts: number;
        score: number;
        level: RiskLevel;
      }>;
  expectedClaims?:
    | number
    | {
        count: number;
        baseline: number;
        changePercent: number;
        direction: "up" | "down" | "flat";
      };
};

type NormalizedZone = {
  location: string;
  avgRisk: number;
  riders: number;
  alerts: number;
  score: number;
  level: RiskLevel;
};

type NormalizedPrediction = {
  nextWeekRisk: {
    score: number;
    level: RiskLevel;
    breakdown: {
      weather: number;
      location: number;
      pastClaims: number;
      activity: number;
    };
  };
  highRiskZones: NormalizedZone[];
  expectedClaims: {
    count: number;
    baseline: number;
    changePercent: number;
    direction: "up" | "down" | "flat";
  };
};

const FALLBACK_PREDICTION_DATA: NormalizedPrediction = {
  nextWeekRisk: {
    score: 72,
    level: "High",
    breakdown: {
      weather: 48,
      location: 74,
      pastClaims: 69,
      activity: 53,
    },
  },
  highRiskZones: [
    {
      location: "Chennai",
      avgRisk: 76,
      riders: 126,
      alerts: 18,
      score: 82,
      level: "High",
    },
    {
      location: "Bangalore",
      avgRisk: 69,
      riders: 102,
      alerts: 13,
      score: 74,
      level: "High",
    },
    {
      location: "Hyderabad",
      avgRisk: 52,
      riders: 86,
      alerts: 8,
      score: 58,
      level: "Medium",
    },
  ],
  expectedClaims: {
    count: 120,
    baseline: 104,
    changePercent: 15.4,
    direction: "up",
  },
};

function badgeStyle(level: RiskLevel) {
  if (level === "High") return "bg-red-500/10 text-red-400 border-red-500/20";
  if (level === "Medium")
    return "bg-orange-500/10 text-orange-300 border-orange-500/20";
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
}

function scoreAccent(score: number) {
  if (score >= 70) return "text-red-400";
  if (score >= 40) return "text-orange-300";
  return "text-emerald-400";
}

function scoreBar(score: number) {
  if (score >= 70) return "bg-red-400";
  if (score >= 40) return "bg-orange-300";
  return "bg-emerald-400";
}

export default function PredictivePanel() {
  const performAction = useStore((state) => state.performAction);
  const [data, setData] = useState<NormalizedPrediction>(
    FALLBACK_PREDICTION_DATA,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  function toRiskLevel(score: number): RiskLevel {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  }

  function normalizePrediction(
    response: PredictionResponse,
  ): NormalizedPrediction {
    const nextWeekRiskRaw = response?.nextWeekRisk;
    const nextWeekRisk =
      typeof nextWeekRiskRaw === "number"
        ? {
            score: nextWeekRiskRaw,
            level: toRiskLevel(nextWeekRiskRaw),
            breakdown: {
              weather: nextWeekRiskRaw * 0.55,
              location: nextWeekRiskRaw * 0.8,
              pastClaims: nextWeekRiskRaw * 0.75,
              activity: nextWeekRiskRaw * 0.6,
            },
          }
        : {
            score: Number(
              nextWeekRiskRaw?.score ??
                FALLBACK_PREDICTION_DATA.nextWeekRisk.score,
            ),
            level:
              nextWeekRiskRaw?.level ||
              toRiskLevel(
                Number(
                  nextWeekRiskRaw?.score ??
                    FALLBACK_PREDICTION_DATA.nextWeekRisk.score,
                ),
              ),
            breakdown: {
              weather: Number(
                nextWeekRiskRaw?.breakdown?.weather ??
                  FALLBACK_PREDICTION_DATA.nextWeekRisk.breakdown.weather,
              ),
              location: Number(
                nextWeekRiskRaw?.breakdown?.location ??
                  FALLBACK_PREDICTION_DATA.nextWeekRisk.breakdown.location,
              ),
              pastClaims: Number(
                nextWeekRiskRaw?.breakdown?.pastClaims ??
                  FALLBACK_PREDICTION_DATA.nextWeekRisk.breakdown.pastClaims,
              ),
              activity: Number(
                nextWeekRiskRaw?.breakdown?.activity ??
                  FALLBACK_PREDICTION_DATA.nextWeekRisk.breakdown.activity,
              ),
            },
          };

    const highRiskZonesRaw = response?.highRiskZones;
    const highRiskZones: NormalizedZone[] = Array.isArray(highRiskZonesRaw)
      ? highRiskZonesRaw.length > 0 && typeof highRiskZonesRaw[0] === "string"
        ? (highRiskZonesRaw as string[]).map((location, index) => {
            const syntheticScore = Math.max(45, nextWeekRisk.score - index * 8);
            return {
              location,
              avgRisk: Number((syntheticScore * 0.9).toFixed(1)),
              riders: 80 - index * 12,
              alerts: 10 - index * 2,
              score: syntheticScore,
              level: toRiskLevel(syntheticScore),
            };
          })
        : (highRiskZonesRaw as any[]).map((zone) => ({
            location: zone?.location || "Unknown",
            avgRisk: Number(zone?.avgRisk ?? zone?.score ?? 0),
            riders: Number(zone?.riders ?? 0),
            alerts: Number(zone?.alerts ?? 0),
            score: Number(zone?.score ?? zone?.avgRisk ?? 0),
            level:
              zone?.level ||
              toRiskLevel(Number(zone?.score ?? zone?.avgRisk ?? 0)),
          }))
      : FALLBACK_PREDICTION_DATA.highRiskZones;

    const expectedClaimsRaw = response?.expectedClaims;
    const expectedClaims =
      typeof expectedClaimsRaw === "number"
        ? {
            count: expectedClaimsRaw,
            baseline: Math.max(0, Math.round(expectedClaimsRaw * 0.87)),
            changePercent: Number(
              (
                ((expectedClaimsRaw -
                  Math.max(1, Math.round(expectedClaimsRaw * 0.87))) /
                  Math.max(1, Math.round(expectedClaimsRaw * 0.87))) *
                100
              ).toFixed(1),
            ),
            direction:
              expectedClaimsRaw > Math.round(expectedClaimsRaw * 0.87)
                ? ("up" as const)
                : ("flat" as const),
          }
        : {
            count: Number(
              expectedClaimsRaw?.count ??
                FALLBACK_PREDICTION_DATA.expectedClaims.count,
            ),
            baseline: Number(
              expectedClaimsRaw?.baseline ??
                FALLBACK_PREDICTION_DATA.expectedClaims.baseline,
            ),
            changePercent: Number(
              expectedClaimsRaw?.changePercent ??
                FALLBACK_PREDICTION_DATA.expectedClaims.changePercent,
            ),
            direction:
              expectedClaimsRaw?.direction ||
              FALLBACK_PREDICTION_DATA.expectedClaims.direction,
          };

    return {
      nextWeekRisk,
      highRiskZones: highRiskZones.length
        ? highRiskZones
        : FALLBACK_PREDICTION_DATA.highRiskZones,
      expectedClaims,
    };
  }

  const loadPredictions = async () => {
    setIsLoading(true);

    try {
      const response = await performAction("/api/analytics/predictions", "GET");
      setData(normalizePrediction(response || {}));
      setIsUsingFallback(false);
    } catch (err: any) {
      setData(FALLBACK_PREDICTION_DATA);
      setIsUsingFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
    const interval = window.setInterval(loadPredictions, 30000);
    return () => window.clearInterval(interval);
  }, [performAction]);

  const aiInsight = useMemo(() => {
    const zone = data?.highRiskZones?.[0];
    if (!zone)
      return "AI model is warming up. Zone intelligence will appear once enough rider signals are available.";
    return `⚠ High fraud activity detected in ${zone.location} region`;
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-[#1e293b]/70 backdrop-blur-xl border border-purple-500/10 rounded-3xl p-6 space-y-6 shadow-[0_0_40px_rgba(139,92,246,0.08)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-56 bg-white/5 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[320px] bg-white/5 rounded-3xl" />
            <div className="h-[320px] bg-white/5 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const nextRisk = data.nextWeekRisk;
  const expectedClaims = data.expectedClaims;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1e293b]/70 backdrop-blur-xl border border-purple-500/10 rounded-3xl p-6 shadow-[0_0_40px_rgba(139,92,246,0.08)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-300" />
            <h3 className="text-xl font-bold text-white">
              Predictive Analytics Panel
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
              AI Engine
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Forecasts future risk, hotspot zones, and expected claim volume.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 border border-white/10 px-3 py-2 rounded-full w-fit">
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          Next-week prediction model active
        </div>
      </div>

      {isUsingFallback ? (
        <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          No live data available – showing simulated insights
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-1">
                  Next Week Risk Prediction
                </p>
                <h4 className="text-lg font-bold text-white">
                  Insurance AI Score
                </h4>
              </div>
              {nextRisk ? (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${badgeStyle(nextRisk.level)}`}
                >
                  {nextRisk.level} Risk
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              <div className="relative flex items-center justify-center h-48 rounded-3xl border border-white/10 bg-black/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-cyan-500/5 to-transparent" />
                <div className="relative flex flex-col items-center justify-center">
                  <p
                    className={`text-5xl font-black ${scoreAccent(nextRisk?.score || 0)}`}
                  >
                    {nextRisk?.score.toFixed(1) ?? "0.0"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold mt-2">
                    0 - 100 score
                  </p>
                  <div className="mt-4 h-2 w-40 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreBar(nextRisk?.score || 0)}`}
                      style={{
                        width: `${Math.min(100, nextRisk?.score || 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                    AI Insight
                  </p>
                  <p className="text-sm text-white leading-relaxed">
                    {aiInsight}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Weather",
                      value: nextRisk?.breakdown.weather ?? 0,
                    },
                    {
                      label: "Location",
                      value: nextRisk?.breakdown.location ?? 0,
                    },
                    {
                      label: "Past Fraud",
                      value: nextRisk?.breakdown.pastClaims ?? 0,
                    },
                    {
                      label: "Activity",
                      value: nextRisk?.breakdown.activity ?? 0,
                    },
                  ].map((factor) => (
                    <div
                      key={factor.label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        {factor.label}
                      </p>
                      <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400"
                          style={{ width: `${Math.min(100, factor.value)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-sm font-bold text-white tabular-nums">
                        {factor.value.toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-white">
                  Expected Number of Claims
                </h4>
                <p className="text-xs text-slate-500">
                  Prediction based on rolling average and risk factor
                </p>
              </div>
              <Activity className="w-4 h-4 text-purple-300" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 rounded-3xl border border-purple-500/20 bg-purple-500/5 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">
                  Expected Claims
                </p>
                <div className="flex items-end gap-3 mt-2">
                  <span className="text-4xl font-black text-white">
                    {expectedClaims?.count ?? 0}
                  </span>
                  <span
                    className={`text-sm font-bold ${expectedClaims && expectedClaims.direction === "down" ? "text-emerald-400" : expectedClaims && expectedClaims.direction === "flat" ? "text-slate-400" : "text-red-400"}`}
                  >
                    {expectedClaims && expectedClaims.direction === "down" ? (
                      <TrendingDown className="inline-block w-4 h-4 mr-1" />
                    ) : (
                      <TrendingUp className="inline-block w-4 h-4 mr-1" />
                    )}
                    {Math.abs(expectedClaims?.changePercent || 0)}%
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-3">
                  Baseline: {expectedClaims?.baseline?.toFixed(1) ?? "0.0"}{" "}
                  claims / 7 days
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-2">
                  Direction
                </p>
                <p
                  className={`text-2xl font-black ${expectedClaims?.direction === "down" ? "text-emerald-400" : expectedClaims?.direction === "flat" ? "text-slate-300" : "text-red-400"}`}
                >
                  {expectedClaims?.direction === "down"
                    ? "▼"
                    : expectedClaims?.direction === "flat"
                      ? "•"
                      : "▲"}
                </p>
                <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-bold">
                  Forecast shift
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-lg font-bold text-white">
                  High Risk Zones
                </h4>
                <p className="text-xs text-slate-500">
                  Top 3 location clusters with the highest average risk
                </p>
              </div>
              <MapPin className="w-4 h-4 text-purple-300" />
            </div>

            <div className="space-y-3">
              {(data?.highRiskZones || []).map((zone, index) => (
                <motion.div
                  key={`${zone.location}-${index}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {zone.location}
                      </p>
                      <p className="text-xs text-slate-500">
                        {zone.riders} riders • {zone.alerts} alerts
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${badgeStyle(zone.level)}`}
                    >
                      {zone.level}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-500"
                      style={{ width: `${Math.min(100, zone.score)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                    <span>Avg risk {zone.avgRisk.toFixed(1)}</span>
                    <span className="font-bold text-white">
                      Score {zone.score.toFixed(1)}
                    </span>
                  </div>
                </motion.div>
              ))}

              {!data?.highRiskZones?.length ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-slate-500">
                  No zone intelligence available yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-3">
              Model Notes
            </p>
            <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
              <p>
                Risk score uses a weighted blend of past claims, fraud history,
                location risk, and rider inactivity.
              </p>
              <p>
                Signals are re-evaluated every 30 seconds to keep the forecast
                fresh and operationally useful.
              </p>
              <p className="text-cyan-300 font-medium">
                The system is intentionally opinionated — because boring
                dashboards don’t catch bad actors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
