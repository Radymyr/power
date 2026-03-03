import { fetchDtekData } from "../src/dtek-client.js";
import { resolveActualFactDay } from "../src/fact.js";
import { getCurrentPowerStatus } from "../src/power-status.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_CITY = "м. Кам’янське";
const DEFAULT_STREET = "вул. Архітектурна";
const KYIV_TIMEZONE = "Europe/Kyiv";

function getHouseData(
  data: Record<string, unknown>,
  house: string,
): Record<string, unknown> {
  const match = data[house];
  if (match && typeof match === "object") {
    return match as Record<string, unknown>;
  }
  return {};
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
    const outages = getHouseData(data.data, house);
    const subTypeReason = Array.isArray(outages.sub_type_reason)
      ? outages.sub_type_reason[0]
      : null;

    const resolvedFact = resolveActualFactDay(
      data.fact?.data,
      new Date(),
      KYIV_TIMEZONE,
    );
    const powerStatus =
      typeof subTypeReason === "string" && subTypeReason.length > 0
        ? getCurrentPowerStatus(resolvedFact.day, {
            now: new Date(),
            timeZone: KYIV_TIMEZONE,
            typeReason: subTypeReason,
          })
        : { has_power: null, next_off: null, next_on: null };

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
