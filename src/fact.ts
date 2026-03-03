import { getStartOfDayEpochSeconds } from "./timezone.js";
import type { FactCollection, FactDay } from "./types.js";

const DAY_SECONDS = 24 * 60 * 60;

interface ResolvedFactDay {
  key: string | null;
  day: FactDay;
}

export function resolveActualFactDay(
  factData: FactCollection | null | undefined,
  now = new Date(),
  timeZone = "Europe/Kyiv",
): ResolvedFactDay {
  if (!factData || typeof factData !== "object") {
    return { key: null, day: {} };
  }

  const target = getStartOfDayEpochSeconds(now, timeZone);
  const preferredKeys = [target, target - DAY_SECONDS, target + DAY_SECONDS];

  for (const key of preferredKeys) {
    const match = factData[String(key)];
    if (match && typeof match === "object") {
      return { key: String(key), day: match };
    }
  }

  const numericKeys = Object.keys(factData)
    .map((key) => Number.parseInt(key, 10))
    .filter((key) => Number.isFinite(key));

  if (numericKeys.length === 0) {
    return { key: null, day: {} };
  }

  const nearest = numericKeys.reduce((closest, current) => {
    return Math.abs(current - target) < Math.abs(closest - target)
      ? current
      : closest;
  }, numericKeys[0]);

  const nearestDay = factData[String(nearest)];
  if (!nearestDay || typeof nearestDay !== "object") {
    return { key: null, day: {} };
  }

  return {
    key: String(nearest),
    day: nearestDay,
  };
}
