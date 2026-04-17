const admin = require("firebase-admin");

const DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeStatus(value = "") {
  return String(value).toLowerCase();
}

function statusFromScore(score) {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function formatTrendLabel(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function countByDay(items, days = 14) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const rows = [];
  for (let i = 0; i < days; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dayStart = new Date(current);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const total = items.filter((item) => {
      const ts = toDate(
        item.timestamp ||
          item.created_at ||
          item.processed_at ||
          item.updated_at,
      );
      return ts && ts >= dayStart && ts <= dayEnd;
    }).length;

    rows.push({
      label: formatTrendLabel(current),
      date: current.toLocaleDateString("en-US", { weekday: "short" }),
      value: total,
    });
  }

  return rows;
}

function buildLocationRisk(users, alerts) {
  const userMap = new Map();

  users.forEach((user) => {
    const userId = user.id || user.user_id;
    if (userId) {
      userMap.set(String(userId), user);
    }
  });

  const byLocation = new Map();

  users.forEach((user) => {
    const location = user.work_location || user.location || "Unknown";
    const bucket = byLocation.get(location) || {
      location,
      riders: 0,
      totalRisk: 0,
      alerts: 0,
    };

    bucket.riders += 1;
    bucket.totalRisk += Number(user.risk_score || 0) * 100;
    byLocation.set(location, bucket);
  });

  alerts.forEach((alert) => {
    const linkedUser = userMap.get(
      String(alert.user_id || alert.userId || alert.rider_id || ""),
    );
    const location =
      alert.location ||
      alert.work_location ||
      linkedUser?.work_location ||
      linkedUser?.location;
    if (!location || !byLocation.has(location)) return;
    const bucket = byLocation.get(location);
    bucket.alerts += 1;
  });

  return [...byLocation.values()]
    .map((bucket) => {
      const avgRisk = bucket.riders ? bucket.totalRisk / bucket.riders : 0;
      const alertLift = bucket.riders
        ? (bucket.alerts / bucket.riders) * 35
        : 0;
      const score = clamp(
        avgRisk * 0.7 + alertLift + Math.min(bucket.alerts * 4, 20),
      );

      return {
        location: bucket.location,
        avgRisk: Number(avgRisk.toFixed(1)),
        riders: bucket.riders,
        alerts: bucket.alerts,
        score: Number(score.toFixed(1)),
        level: statusFromScore(score),
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function getCollections() {
  const db = admin.firestore();

  const readCollection = async (collectionName) => {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  const [users, payouts, alerts] = await Promise.all([
    readCollection("users"),
    readCollection("payouts"),
    readCollection("fraud_alerts"),
  ]);

  return { users, payouts, alerts };
}

exports.getFraudAnalytics = async (req, res) => {
  try {
    const { users, payouts, alerts } = await getCollections();

    const activeFraudAlerts = alerts.filter((alert) => {
      const status = normalizeStatus(alert.status);
      return !["resolved", "ignored", "completed"].includes(status);
    });

    const totalClaims = payouts.length || 0;
    const fraudRate = totalClaims
      ? Number(((activeFraudAlerts.length / totalClaims) * 100).toFixed(1))
      : 0;

    const alertsByUser = new Map();
    alerts.forEach((alert) => {
      const userId =
        alert.user_id || alert.userId || alert.rider_id || alert.targetUserId;
      if (!userId) return;
      alertsByUser.set(userId, (alertsByUser.get(userId) || 0) + 1);
    });

    const topUsers = users
      .map((user) => {
        const userId = user.id || user.user_id;
        const alertCount = alertsByUser.get(userId) || 0;
        const baseRisk = Number(user.risk_score || 0) * 100;
        const compositeScore = clamp(baseRisk * 0.65 + alertCount * 8);

        return {
          name: user.emp_name || user.name || "Anonymous",
          risk: Number(compositeScore.toFixed(1)),
          riskScore: Number(compositeScore.toFixed(1)),
          alerts: alertCount,
          status: user.status || statusFromScore(compositeScore),
          location: user.work_location || user.location || "Unknown",
        };
      })
      .sort((a, b) => b.alerts - a.alerts || b.riskScore - a.riskScore)
      .slice(0, 5);

    const fraudTrend = countByDay(alerts, 14);

    res.json({
      fraudRate: Number(fraudRate.toFixed(1)),
      topUsers,
      trend: fraudTrend.map((point) => ({
        date: point.date,
        label: point.label,
        value: point.value,
      })),
      fraudTrend,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Failed to build fraud analytics",
        details: error.message,
      });
  }
};

exports.getPredictions = async (req, res) => {
  try {
    const { users, payouts, alerts } = await getCollections();

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentPayouts = payouts.filter((item) => {
      const ts = toDate(item.timestamp || item.created_at || item.processed_at);
      return ts && ts >= sevenDaysAgo;
    });

    const recentAlerts = alerts.filter((item) => {
      const ts = toDate(item.timestamp || item.created_at || item.updated_at);
      return ts && ts >= sevenDaysAgo;
    });

    const dailyCounts = countByDay([...recentPayouts, ...recentAlerts], 7);
    const avgLast7Days =
      dailyCounts.reduce((sum, row) => sum + row.value, 0) / 7;

    const inactiveRiders = users.filter((user) => {
      const status = normalizeStatus(user.status);
      return ["under_review", "suspended", "banned"].includes(status);
    }).length;

    const weatherEvents = recentPayouts.filter((item) => {
      const type = normalizeStatus(item.event_type);
      return ["rain", "heatwave", "storm", "flood"].includes(type);
    }).length;

    const activityRisk = users.length
      ? (inactiveRiders / users.length) * 100
      : 0;
    const fraudHistoryRisk = users.length
      ? clamp(
          (recentAlerts.length / users.length) * 12 +
            Math.min(alerts.length * 0.8, 25),
        )
      : 0;
    const weatherRisk = recentPayouts.length
      ? clamp((weatherEvents / recentPayouts.length) * 100)
      : 0;

    const locationBuckets = buildLocationRisk(users, alerts).slice(0, 3);
    const locationRisk = locationBuckets.length
      ? locationBuckets.reduce((sum, zone) => sum + zone.score, 0) /
        locationBuckets.length
      : 0;

    const pastClaimsRisk = clamp(
      avgLast7Days * 7 * 2 + recentAlerts.length * 4 + weatherRisk * 0.25,
    );

    const nextWeekRiskScore = clamp(
      0.4 * pastClaimsRisk +
        0.3 * fraudHistoryRisk +
        0.2 * locationRisk +
        0.1 * activityRisk,
    );

    const nextWeekRisk = {
      score: Number(nextWeekRiskScore.toFixed(1)),
      level: statusFromScore(nextWeekRiskScore),
      breakdown: {
        weather: Number(weatherRisk.toFixed(1)),
        location: Number(locationRisk.toFixed(1)),
        pastClaims: Number(pastClaimsRisk.toFixed(1)),
        activity: Number(activityRisk.toFixed(1)),
      },
    };

    const expectedClaimsBaseline = Number(avgLast7Days.toFixed(1));
    const riskFactor = Number((nextWeekRiskScore / 18).toFixed(1));
    const expectedCount = Math.max(
      0,
      Math.round(expectedClaimsBaseline + riskFactor),
    );
    const changePercent = expectedClaimsBaseline
      ? Number(
          (
            ((expectedCount - expectedClaimsBaseline) /
              expectedClaimsBaseline) *
            100
          ).toFixed(1),
        )
      : expectedCount > 0
        ? 100
        : 0;

    const highRiskZones = buildLocationRisk(users, alerts).slice(0, 3);

    res.json({
      nextWeekRisk: nextWeekRisk.score,
      highRiskZones: highRiskZones.map((zone) => zone.location),
      expectedClaims: expectedCount,
      nextWeekRiskDetails: nextWeekRisk,
      highRiskZoneDetails: highRiskZones,
      expectedClaimsDetails: {
        count: expectedCount,
        baseline: expectedClaimsBaseline,
        changePercent,
        direction:
          changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat",
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Failed to build predictive analytics",
        details: error.message,
      });
  }
};
