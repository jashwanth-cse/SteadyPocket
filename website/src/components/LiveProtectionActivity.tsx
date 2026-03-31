import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

// --- Types ---
type TriggerType = 'weather' | 'location' | 'inactivity' | 'incident';

interface TriggerEvent {
  type: TriggerType;
  message: string;
  action: string;
  reason: string;
  affected: number;
  time: string;
}

// --- Config maps ---
const typeConfig: Record<
  TriggerType,
  {
    icon: string;
    border: string;
    glow: string;
    badge: string;
    label: string;
    route: string;
  }
> = {
  weather: {
    icon: '🌧️',
    border: 'border-blue-500/60',
    glow: 'hover:shadow-blue-500/10',
    badge: 'bg-blue-500/10 text-blue-400',
    label: 'Weather',
    route: '/payouts',
  },
  location: {
    icon: '📍',
    border: 'border-yellow-500/60',
    glow: 'hover:shadow-yellow-500/10',
    badge: 'bg-yellow-500/10 text-yellow-400',
    label: 'Location',
    route: '/policies',
  },
  inactivity: {
    icon: '⏱️',
    border: 'border-orange-500/60',
    glow: 'hover:shadow-orange-500/10',
    badge: 'bg-orange-500/10 text-orange-400',
    label: 'Inactivity',
    route: '/riders',
  },
  incident: {
    icon: '🚨',
    border: 'border-red-500/60',
    glow: 'hover:shadow-red-500/10',
    badge: 'bg-red-500/10 text-red-400',
    label: 'Incident',
    route: '/payouts',
  },
};

// --- Dummy data (swap for GET /admin/triggers) ---
const DUMMY_TRIGGERS: TriggerEvent[] = [
  {
    type: 'weather',
    message: 'Rain detected in Bangalore',
    action: 'Premium increased +₹10',
    reason: 'Heavy rain increases accident probability by 34%',
    affected: 3,
    time: '2 mins ago',
  },
  {
    type: 'location',
    message: 'High-risk zone detected in Chennai',
    action: 'Risk score updated',
    reason: 'Zone flagged for road accidents & theft incidents',
    affected: 7,
    time: '5 mins ago',
  },
  {
    type: 'inactivity',
    message: 'Rider inactive for 6 hours',
    action: 'Claim suggested',
    reason: 'Unusual inactivity pattern detected during peak hours',
    affected: 1,
    time: '10 mins ago',
  },
  {
    type: 'incident',
    message: 'Incident reported by Jashwanth',
    action: 'Claim auto-initiated',
    reason: 'GPS halt + impact signal triggered incident protocol',
    affected: 1,
    time: '15 mins ago',
  },
];

// --- Sub-component: single trigger row ---
function TriggerItem({ event, index }: { event: TriggerEvent; index: number }) {
  const navigate = useNavigate();
  const cfg = typeConfig[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.09, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ scale: 1.015 }}
      onClick={() => navigate(cfg.route)}
      className={`
        flex items-start gap-4 p-4 rounded-2xl cursor-pointer
        border-l-2 ${cfg.border}
        bg-white/[0.025] hover:bg-white/[0.05]
        border border-white/5 hover:border-white/[0.12]
        hover:shadow-lg ${cfg.glow}
        transition-all duration-200 group
      `}
    >
      {/* Icon badge */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-xl
          flex items-center justify-center text-lg
          ${cfg.badge} transition-transform duration-200 group-hover:scale-110
        `}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1 — message + type label + AI badge */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-sm font-semibold text-white leading-snug">
            {event.message}
          </p>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Type label */}
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
              {cfg.label}
            </span>
            {/* AI badge */}
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-md">
              AUTO
            </span>
          </div>
        </div>

        {/* Row 2 — AI reasoning */}
        <p className="text-[11px] text-neutral-500 mb-2 leading-relaxed">
          🧠 {event.reason}
        </p>

        {/* Row 3 — action + affected + timestamp */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Action pill */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full group-hover:bg-emerald-500/[0.15] transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {event.action}
            </span>

            {/* Affected riders count */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full">
              <Users className="w-3 h-3" />
              {event.affected} {event.affected === 1 ? 'rider' : 'riders'} protected
            </span>
          </div>

          {/* Timestamp + nav hint */}
          <div className="flex items-center gap-1 text-neutral-600">
            <span className="text-[11px]">{event.time}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main component ---
interface LiveProtectionActivityProps {
  /** Override dummy data with live triggers from GET /admin/triggers */
  triggers?: TriggerEvent[];
}

export default function LiveProtectionActivity({ triggers = DUMMY_TRIGGERS }: LiveProtectionActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#111111] border border-white/5 p-6 rounded-3xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">⚡ Live Protection Activity</h3>

          {/* Live badge — double ring pulse */}
          <span className="relative flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 pl-2 pr-3 py-1 rounded-full">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
            </span>
            Live
          </span>
        </div>

        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold hidden sm:block">
          AI-triggered events
        </p>
      </div>

      {/* Event list */}
      <div className="space-y-3">
        {triggers.length === 0 ? (
          <p className="text-center text-neutral-600 text-sm py-8">No recent activity</p>
        ) : (
          triggers.map((event, i) => (
            <TriggerItem key={`${event.type}-${i}`} event={event} index={i} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-[11px] text-neutral-700">
          {triggers.length} event{triggers.length !== 1 ? 's' : ''} in last 30 mins
        </span>
        <span className="text-[11px] text-neutral-700">
          Powered by Steady Pocket automation engine
        </span>
      </div>
    </motion.div>
  );
}
