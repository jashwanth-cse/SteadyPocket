import { useState } from 'react';
import { motion } from 'motion/react';
import {
  CloudRain,
  MapPin,
  Activity,
  Zap,
  Shield,
  Users,
  TrendingUp,
  TrendingDown,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react';
import LiveProtectionActivity from '../components/LiveProtectionActivity';
import type { TriggerEvent, TriggerType } from '../components/LiveProtectionActivity';

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const EXTENDED_TRIGGERS: TriggerEvent[] = [
  { type: 'weather',    message: 'Rain detected in Bangalore',           action: 'Premium increased +₹10',   reason: 'Heavy rain increases accident probability by 34%',         affected: 3, time: '2 mins ago'  },
  { type: 'weather',    message: 'Storm warning issued in Mumbai',        action: 'Coverage extended +6h',     reason: 'Severe weather protocol activated for rider safety',        affected: 8, time: '8 mins ago'  },
  { type: 'location',   message: 'High-risk zone detected in Chennai',    action: 'Risk score updated',        reason: 'Zone flagged for road accidents & theft incidents',          affected: 7, time: '5 mins ago'  },
  { type: 'location',   message: 'Construction zone entered by 4 riders', action: 'Hazard alert sent',         reason: 'Active road work increases collision risk by 22%',          affected: 4, time: '12 mins ago' },
  { type: 'inactivity', message: 'Rider inactive for 6 hours',            action: 'Claim suggested',           reason: 'Unusual inactivity pattern detected during peak hours',     affected: 1, time: '10 mins ago' },
  { type: 'inactivity', message: 'No GPS signal for Arjun (3h)',          action: 'Wellness check triggered',  reason: 'Sudden GPS dropout in non-rest period',                     affected: 1, time: '22 mins ago' },
  { type: 'incident',   message: 'Incident reported by Jashwanth',        action: 'Claim auto-initiated',      reason: 'GPS halt + impact signal triggered incident protocol',      affected: 1, time: '15 mins ago' },
  { type: 'incident',   message: 'Hard brake event — Priya, Hyderabad',   action: 'Risk flag raised',          reason: 'Sudden deceleration pattern detected via telematics',      affected: 1, time: '28 mins ago' },
];

interface PremiumFactor {
  label: string;
  value: number;
  delta: 'up' | 'down' | null;
  icon: React.ElementType;
  colorClass: string;
}

const PREMIUM_FACTORS: PremiumFactor[] = [
  { label: 'Base Premium',       value: 150, delta: null,   icon: Shield,    colorClass: 'text-neutral-400' },
  { label: 'Weather Risk (Rain)', value: +10, delta: 'up',   icon: CloudRain, colorClass: 'text-blue-400'    },
  { label: 'High-Risk Zone',      value: +15, delta: 'up',   icon: MapPin,    colorClass: 'text-yellow-400'  },
  { label: 'Low Activity Bonus',  value:  -5, delta: 'down', icon: Activity,  colorClass: 'text-emerald-400' },
  { label: 'Loyalty Discount',    value: -10, delta: 'down', icon: Zap,       colorClass: 'text-emerald-400' },
];

const FINAL_PREMIUM = PREMIUM_FACTORS.reduce((s, f) => s + f.value, 0);

interface AiInsight {
  id: number;
  icon: React.ElementType;
  title: string;
  detail: string;
  confidence: number;
  impact: 'high' | 'positive' | 'medium';
}

const AI_INSIGHTS: AiInsight[] = [
  {
    id: 1,
    icon: CloudRain,
    title: 'Weather Risk Spike',
    detail: 'Premium increased for 11 riders due to heavy rainfall and high delivery workload across Bangalore & Mumbai corridors.',
    confidence: 92,
    impact: 'high',
  },
  {
    id: 2,
    icon: CheckCircle2,
    title: 'Low-Risk Zone Detected',
    detail: 'Premium reduced for 5 riders operating in newly flagged low-incident zones in Pune. Risk model recalibrated.',
    confidence: 88,
    impact: 'positive',
  },
  {
    id: 3,
    icon: Activity,
    title: 'Inactivity Income Disruption',
    detail: 'Unusual inactivity in 3 rider accounts suggests potential income disruption. Claim pre-check initiated.',
    confidence: 79,
    impact: 'medium',
  },
];

const INSIGHT_STYLES: Record<AiInsight['impact'], { border: string; badge: string; bar: string; icon: string }> = {
  high:     { border: 'border-blue-500/30',    badge: 'bg-blue-500/10 text-blue-400',     bar: 'bg-blue-500',    icon: 'text-blue-400'    },
  positive: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400', bar: 'bg-emerald-500', icon: 'text-emerald-400' },
  medium:   { border: 'border-orange-500/30',  badge: 'bg-orange-500/10 text-orange-400', bar: 'bg-orange-500',  icon: 'text-orange-400'  },
};

const IMPACT_LABELS: Record<AiInsight['impact'], string> = {
  high: 'High Impact', positive: 'Positive Signal', medium: 'Watch',
};

interface RiskBucket {
  label: string;
  count: number;
  pct: number;
  bg: string;
  text: string;
  bar: string;
  border: string;
  icon: React.ElementType;
}

const RISK_BUCKETS: RiskBucket[] = [
  { label: 'High Risk',   count: 12,  pct: 7,  bg: 'bg-red-500/10',     text: 'text-red-400',     bar: 'bg-red-500',    border: 'border-red-500/20',    icon: AlertTriangle   },
  { label: 'Medium Risk', count: 28,  pct: 16, bg: 'bg-orange-500/10',  text: 'text-orange-400',  bar: 'bg-orange-500', border: 'border-orange-500/20', icon: Info            },
  { label: 'Low Risk',    count: 134, pct: 77, bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500',border: 'border-emerald-500/20',icon: CheckCircle2    },
];

type FilterOption = 'all' | TriggerType;

const FILTER_OPTIONS: { id: FilterOption; label: string }[] = [
  { id: 'all',        label: 'All Events' },
  { id: 'weather',    label: '🌧️ Weather'    },
  { id: 'location',   label: '📍 Location'   },
  { id: 'inactivity', label: '⏱️ Inactivity' },
  { id: 'incident',   label: '🚨 Incident'   },
];

// ─────────────────────────────────────────────
// Sub-sections
// ─────────────────────────────────────────────

function PremiumMonitor() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#111111] border border-white/5 p-6 rounded-3xl flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-white">💰 Dynamic Premium Monitor</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Real-time adjustment per rider context</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Calc
        </span>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2.5 flex-1">
        {PREMIUM_FACTORS.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className={`flex items-center justify-between px-4 py-3 rounded-xl ${
              f.delta === null
                ? 'bg-white/[0.04] border border-white/8'
                : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors'
            }`}
          >
            <div className="flex items-center gap-3">
              <f.icon className={`w-4 h-4 ${f.colorClass}`} />
              <span className={`text-sm ${f.delta === null ? 'font-bold text-white' : 'text-neutral-300 font-medium'}`}>
                {f.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {f.delta === 'up'   && <TrendingUp   className="w-3.5 h-3.5 text-red-400"     />}
              {f.delta === 'down' && <TrendingDown  className="w-3.5 h-3.5 text-emerald-400" />}
              <span className={`text-sm font-bold tabular-nums ${
                f.delta === null   ? 'text-white' :
                f.delta === 'up'   ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {f.delta === null ? `₹${f.value}` : `${f.value > 0 ? '+' : ''}₹${f.value}`}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5 my-4" />

      {/* Final premium */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between px-4 py-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
      >
        <div>
          <p className="text-xs text-emerald-400/70 uppercase tracking-widest font-bold mb-0.5">Final Premium</p>
          <p className="text-3xl font-bold text-emerald-400 tabular-nums">₹{FINAL_PREMIUM}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500 mb-1">vs base ₹150</p>
          <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
            +{FINAL_PREMIUM - 150} risk adjustment
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RiskDistribution() {
  const total = RISK_BUCKETS.reduce((s, b) => s + b.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-[#111111] border border-white/5 p-6 rounded-3xl flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">📊 Risk Distribution</h3>
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Users className="w-3.5 h-3.5" />
          {total} riders
        </div>
      </div>

      {RISK_BUCKETS.map((b, i) => (
        <motion.div
          key={b.label}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.07 }}
          className={`p-4 rounded-2xl border ${b.bg} ${b.border}`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <b.icon className={`w-4 h-4 ${b.text}`} />
              <span className={`text-sm font-semibold ${b.text}`}>{b.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white tabular-nums">{b.count}</span>
              <span className="text-xs text-neutral-500">/{total}</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${b.pct}%` }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${b.bar}`}
            />
          </div>
          <p className={`text-[11px] font-bold mt-1.5 ${b.text}`}>{b.pct}% of fleet</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

function AiInsightsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#111111] border border-white/5 p-6 rounded-3xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-white">🧠 AI Risk Insights</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
            GPT-assisted
          </span>
        </div>
        <p className="text-xs text-neutral-500 hidden sm:block">Updated 60s ago</p>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AI_INSIGHTS.map((insight, i) => {
          const style = INSIGHT_STYLES[insight.impact];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              className={`relative p-5 rounded-2xl bg-white/[0.025] border ${style.border} hover:bg-white/[0.045] transition-all duration-200 group overflow-hidden`}
            >
              {/* Subtle top glow line */}
              <div className={`absolute top-0 left-0 right-0 h-px ${style.bar} opacity-40`} />

              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${style.badge}`}>
                <insight.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </div>

              {/* Title + impact badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-white leading-snug">{insight.title}</p>
                <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${style.badge}`}>
                  {IMPACT_LABELS[insight.impact]}
                </span>
              </div>

              {/* Detail */}
              <p className="text-xs text-neutral-500 leading-relaxed mb-4">{insight.detail}</p>

              {/* Confidence bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">AI Confidence</span>
                  <span className={`text-[11px] font-bold ${style.icon}`}>{insight.confidence}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${insight.confidence}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
                    className={`h-full rounded-full ${style.bar}`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function SmartProtectionSystem() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const filteredTriggers =
    activeFilter === 'all'
      ? EXTENDED_TRIGGERS
      : EXTENDED_TRIGGERS.filter((t) => t.type === activeFilter);

  return (
    <div className="space-y-8">

      {/* ── Section 1: Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🛡️ Smart Protection System</h1>
          <p className="text-neutral-500">AI-powered monitoring and dynamic protection for gig workers</p>
        </div>

        {/* System status pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111111] border border-white/5 px-4 py-2.5 rounded-2xl">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">All Systems Active</span>
          </div>
          <div className="flex items-center gap-2 bg-[#111111] border border-white/5 px-4 py-2.5 rounded-2xl">
            <Brain className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">AI Engine Online</span>
          </div>
        </div>
      </motion.div>

      {/* ── Section 2: Premium Monitor + Risk Distribution (2-col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PremiumMonitor />
        </div>
        <div>
          <RiskDistribution />
        </div>
      </div>

      {/* ── Section 3: AI Insights ── */}
      <AiInsightsPanel />

      {/* ── Section 4: Live Trigger Activity + filter ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-600 uppercase tracking-widest font-bold mr-1">Filter:</span>
          <div className="flex gap-1 bg-[#111111] p-1 rounded-2xl border border-white/5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setActiveFilter(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeFilter === opt.id
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-neutral-600 ml-1">
            {filteredTriggers.length} event{filteredTriggers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Activity feed */}
        <LiveProtectionActivity triggers={filteredTriggers} />
      </motion.div>

    </div>
  );
}
