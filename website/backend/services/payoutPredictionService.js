const admin = require("firebase-admin");

const CACHE_TTL_MS = 60 * 60 * 1000;
const predictionCache = new Map();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function normalizeLocation(value) {
  return String(value || "").trim();
}

function normalizeRiskScore(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return numeric <= 1 ? numeric * 100 : numeric;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function seasonForDate(date = new Date()) {
  const month = date.getMonth() + 1;
  if ([6, 7, 8, 9].includes(month)) return "monsoon";
  if ([10, 11].includes(month)) return "cyclone";
  if ([12, 1, 2].includes(month)) return "winter";
  return "summer";
}

function monthLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", { month: "long" });
}

function parseGeminiJson(rawText) {
  const cleaned = String(rawText || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Gemini response did not contain JSON");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function fallbackRiskPrediction(location, context = {}) {
  const normalized = normalizeLocation(location).toLowerCase();
  const season = context.season || seasonForDate();
  const historicalRisk = Number(context.historicalRisk || 0);

  let probability = 0.22;
  if (
    /(chennai|coimbatore|madurai|tirunelveli|mumbai|kochi|vizag|bhubaneswar|kolkata)/i.test(
      normalized,
    )
  ) {
    probability += 0.22;
  }
  if (/(bangalore|hyderabad|pune|mysore|salem)/i.test(normalized)) {
    probability += 0.12;
  }

  if (season === "monsoon") probability += 0.2;
  if (season === "cyclone") probability += 0.18;
  if (season === "winter") probability += 0.05;

  probability += clamp(historicalRisk / 200, 0, 0.2);
  probability = clamp(probability, 0.12, 0.92);

  const riskLevel =
    probability >= 0.66 ? "HIGH" : probability >= 0.4 ? "MEDIUM" : "LOW";
  const reason =
    season === "monsoon"
      ? "Monsoon season approaching"
      : season === "cyclone"
        ? "Cyclone-prone period requires advance reserves"
        : "Historical worker disruption patterns detected";

  const expectedImpact =
    riskLevel === "HIGH"
      ? "High disruption in delivery operations"
      : riskLevel === "MEDIUM"
        ? "Moderate rider interruptions with payout pressure"
        : "Low but measurable payout exposure";

  return {
    riskLevel,
    probability: Number(probability.toFixed(2)),
    reason,
    expectedImpact,
    source: "simulated",
  };
}

async function getWeatherRisk(location, context = {}) {
  const normalizedLocation = normalizeLocation(location);
  const now = new Date();
  const cacheKey = `${normalizedLocation.toLowerCase()}|${monthLabel(now)}|${seasonForDate(now)}`;
  const cached = predictionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (!GEMINI_API_KEY) {
    const simulated = fallbackRiskPrediction(normalizedLocation, context);
    predictionCache.set(cacheKey, {
      value: simulated,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return simulated;
  }

  const prompt = [
    `Given the location ${normalizedLocation}, India and current seasonal patterns (${seasonForDate(now)} in ${monthLabel(now)}), predict the probability of heavy rain, cyclone, or disruption in the next 30 days.`,
    `Historical worker risk score context: ${Number(context.historicalRisk || 0).toFixed(1)}.`,
    `Approximate verified worker count in the region: ${Number(context.userCount || 0)}.`,
    `Return JSON only with keys riskLevel, probability, reason, expectedImpact.`,
    `riskLevel must be one of HIGH, MEDIUM, LOW. probability must be a decimal from 0 to 1.`,
  ].join(" ");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const payload = await response.json();
    const text =
      payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "")
        .join("") || "";
    const parsed = parseGeminiJson(text);

    const probability = clamp(
      Number(
        parsed.probability > 1 ? parsed.probability / 100 : parsed.probability,
      ),
      0.05,
      0.95,
    );

    const value = {
      riskLevel: String(parsed.riskLevel || "MEDIUM").toUpperCase(),
      probability: Number(probability.toFixed(2)),
      reason: String(parsed.reason || "Seasonal disruption risk detected"),
      expectedImpact: String(
        parsed.expectedImpact ||
          "Potential payout pressure for verified workers",
      ),
      source: "gemini",
    };

    predictionCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return value;
  } catch (error) {
    const simulated = fallbackRiskPrediction(normalizedLocation, context);
    predictionCache.set(cacheKey, {
      value: simulated,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return simulated;
  }
}

function getPayoutAmount(payout) {
  return Number(payout.amount ?? payout.total_payout ?? 0);
}

function groupUsersByLocation(users) {
  const groups = new Map();

  users.forEach((user) => {
    const location = normalizeLocation(
      user.city || user.work_location || user.location || "Unknown",
    );
    if (!location || location === "Unknown") return;

    const bucket = groups.get(location) || {
      location,
      users: [],
      totalRisk: 0,
    };

    bucket.users.push({
      userId: user.id,
      name: user.emp_name || user.name || "Anonymous",
      location,
      riskScore: normalizeRiskScore(user.risk_score),
    });
    bucket.totalRisk += normalizeRiskScore(user.risk_score);
    groups.set(location, bucket);
  });

  return groups;
}

function buildAveragePayoutIndex(payouts, userMap) {
  const byLocation = new Map();
  const globalAmounts = [];

  payouts.forEach((payout) => {
    const amount = getPayoutAmount(payout);
    if (!amount) return;
    globalAmounts.push(amount);

    const linkedUser = userMap.get(
      String(payout.userId || payout.user_id || ""),
    );
    const location = normalizeLocation(
      payout.location ||
        linkedUser?.city ||
        linkedUser?.work_location ||
        linkedUser?.location,
    );
    if (!location || location === "Unknown") return;

    const bucket = byLocation.get(location) || [];
    bucket.push(amount);
    byLocation.set(location, bucket);
  });

  const globalAverage = globalAmounts.length
    ? globalAmounts.reduce((sum, value) => sum + value, 0) /
      globalAmounts.length
    : 1000;

  return {
    globalAverage,
    byLocation,
  };
}

async function buildPredictivePayoutPlan() {
  const db = admin.firestore();

  const [usersSnapshot, payoutsSnapshot] = await Promise.all([
    db
      .collection("users")
      .where("verificationStatus", "==", "fully_verified")
      .get(),
    db.collection("payouts").get(),
  ]);

  const users = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  const payouts = payoutsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const verifiedUsers = users.filter(
    (user) =>
      String(user.verificationStatus || "").toLowerCase() === "fully_verified",
  );
  const effectiveUsers = verifiedUsers.length ? verifiedUsers : users;

  const userMap = new Map(
    effectiveUsers.map((user) => [String(user.id), user]),
  );
  const groups = groupUsersByLocation(effectiveUsers);
  const payoutIndex = buildAveragePayoutIndex(payouts, userMap);

  const regions = [];

  for (const [location, group] of groups.entries()) {
    const historicalRisk = group.users.length
      ? group.totalRisk / Math.max(1, group.users.length)
      : 0;

    const risk = await getWeatherRisk(location, {
      userCount: group.users.length,
      historicalRisk,
      season: seasonForDate(),
    });

    const probability = clamp(Number(risk.probability || 0), 0, 1);
    const riskLevel = String(risk.riskLevel || "MEDIUM").toUpperCase();
    const factor = 0.5;
    const expectedClaims = Math.max(
      0,
      Math.round(group.users.length * probability * factor),
    );

    const locationPayouts = payoutIndex.byLocation.get(location) || [];
    const averagePayoutAmount = locationPayouts.length
      ? locationPayouts.reduce((sum, value) => sum + value, 0) /
        locationPayouts.length
      : payoutIndex.globalAverage;
    const estimatedPayout = Math.round(expectedClaims * averagePayoutAmount);

    regions.push({
      location,
      users: group.users.length,
      verifiedWorkers: group.users,
      risk: riskLevel,
      probability: Number(probability.toFixed(2)),
      expectedClaims,
      estimatedPayout,
      avgPayoutAmount: Math.round(averagePayoutAmount),
      reason: risk.reason,
      expectedImpact: risk.expectedImpact,
      riskScore: Math.round(probability * 100),
      source: risk.source,
    });
  }

  const sortedRegions = regions.sort(
    (a, b) => b.estimatedPayout - a.estimatedPayout,
  );
  const totalEstimatedPayoutNeeded = sortedRegions.reduce(
    (sum, region) => sum + region.estimatedPayout,
    0,
  );

  const topRegion = sortedRegions[0];
  const aiInsight = topRegion
    ? `High rainfall expected in ${topRegion.location} region`
    : "No fully verified workers found yet";

  return {
    regions: sortedRegions,
    totalRegionsAtRisk: sortedRegions.length,
    totalEstimatedPayoutNeeded,
    aiInsight,
    fallbackUsed:
      verifiedUsers.length === 0 ||
      sortedRegions.some((region) => region.source === "simulated"),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  buildPredictivePayoutPlan,
  getWeatherRisk,
};
