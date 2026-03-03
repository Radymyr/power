import { fetchDtekData } from "../src/dtek-client.js";
import { resolveActualFactDay } from "../src/fact.js";
import { getCurrentPowerStatus } from "../src/power-status.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { FactDay } from "../src/types.js";

const DEFAULT_CITY = "Ваш город";
const DEFAULT_STREET = "Ваша улица";
const KYIV_TIMEZONE = "Europe/Kyiv";

function getHouseData(
  data: unknown,
  house: string,
): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return {};
  }

  const safeData = data as Record<string, unknown>;
  const match = safeData[house];
  if (match && typeof match === "object") {
    return match as Record<string, unknown>;
  }

  // Fallback: if API returns a single object instead of map by house.
  if (safeData.sub_type_reason && typeof safeData.sub_type_reason === "object") {
    return safeData;
  }

  return {};
}

function normalizeReason(reason: string): string[] {
  const trimmed = reason.trim();
  const variants = new Set<string>([trimmed]);
  if (trimmed.includes(".")) {
    variants.add(trimmed.replaceAll(".", "_"));
  }
  if (trimmed.includes("_")) {
    variants.add(trimmed.replaceAll("_", "."));
  }

  return Array.from(variants);
}

function extractSubTypeReason(outages: Record<string, unknown>): string | null {
  const raw = outages.sub_type_reason;
  if (!Array.isArray(raw) || typeof raw[0] !== "string") {
    return null;
  }
  return raw[0];
}

function resolvePowerStatus(
  factDay: FactDay,
  subTypeReason: string | null,
): { has_power: boolean | null; next_off: string | null; next_on: string | null } {
  if (!subTypeReason) {
    return { has_power: null, next_off: null, next_on: null };
  }

  for (const reason of normalizeReason(subTypeReason)) {
    const status = getCurrentPowerStatus(factDay, {
      now: new Date(),
      timeZone: KYIV_TIMEZONE,
      typeReason: reason,
    });

    if (status.has_power !== null || status.next_off !== null || status.next_on !== null) {
      return status;
    }
  }

  return { has_power: null, next_off: null, next_on: null };
}

function isValidDtekPayload(data: unknown): data is { data: unknown; fact?: { data?: unknown } } {
  return !!data && typeof data === "object" && "data" in data;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const city =
    typeof req.query.city === "string" && req.query.city.trim()
      ? req.query.city.trim()
      : DEFAULT_CITY;
  const street =
    typeof req.query.street === "string" && req.query.street.trim()
      ? req.query.street.trim()
      : DEFAULT_STREET;
  const house =
    typeof req.query.house === "string" && req.query.house.trim()
      ? req.query.house.trim()
      : null;

  if (!house) {
    res.status(400).json({
      ok: false,
      error:
        "Потрібно вказати номер будинку (house), інакше неможливо точно визначити графік",
    });
    return;
  }

  try {
    const data = await fetchDtekData({ city, street });
    if (!isValidDtekPayload(data)) {
      res.status(502).json({
        ok: false,
        error: "Invalid DTEK payload",
        details: "Response structure does not contain data field",
      });
      return;
    }

    const outages = getHouseData(data.data, house);
    const subTypeReason = extractSubTypeReason(outages);
    const resolvedFact = resolveActualFactDay(
      data.fact?.data,
      new Date(),
      KYIV_TIMEZONE,
    );
    const powerStatus = resolvePowerStatus(resolvedFact.day, subTypeReason);

    res.status(200).json({
      ok: true,
      address: `${city}, ${street}, ${house}`,
      now: new Date().toLocaleString("uk-UA", { timeZone: KYIV_TIMEZONE }),
      outages,
      sub_type_reason: subTypeReason,
      fact_day_key: resolvedFact.key,
      current_status: powerStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      ok: false,
      error: "Failed to fetch DTEK data",
      details: message,
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
