import { getZonedDateParts } from "./timezone.js";
import type { FactDay, PowerStatus, SlotValue } from "./types.js";

interface PowerStatusOptions {
  now?: Date;
  timeZone?: string;
  typeReason: string;
}

function getSlotState(value: SlotValue | undefined, half: 0 | 1): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  if (value === "first") return half === 1;
  if (value === "second") return half === 0;
  return null;
}

function formatHalfHourIndex(index: number): string {
  const normalized = ((index % 48) + 48) % 48;
  const hour = Math.floor(normalized / 2);
  const minute = normalized % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function getCurrentPowerStatus(
  outages: FactDay | null | undefined,
  options: PowerStatusOptions,
): PowerStatus {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone ?? "Europe/Kyiv";
  const typeReason = options.typeReason;

  if (!typeReason) {
    throw new Error("typeReason must be passed");
  }

  if (!outages || typeof outages !== "object") {
    return { has_power: null, next_off: null, next_on: null };
  }

  const schedule = outages[typeReason];
  if (!schedule || typeof schedule !== "object") {
    return { has_power: null, next_off: null, next_on: null };
  }

  const local = getZonedDateParts(now, timeZone);
  const currentHalf = local.minute >= 30 ? 1 : 0;
  const currentIndex = local.hour * 2 + currentHalf;
  const currentSlotKey = String(local.hour + 1);
  const currentValue = schedule[currentSlotKey];
  const hasPower = getSlotState(currentValue, currentHalf as 0 | 1);

  if (hasPower === null) {
    return { has_power: null, next_off: null, next_on: null };
  }

  let nextOff: string | null = null;
  let nextOn: string | null = null;

  for (let shift = 1; shift <= 96; shift += 1) {
    const nextIndex = currentIndex + shift;
    const slotHour = Math.floor((nextIndex % 48) / 2);
    const slotHalf = (nextIndex % 2) as 0 | 1;
    const slotKey = String(slotHour + 1);
    const value = schedule[slotKey];
    const state = getSlotState(value, slotHalf);

    if (state === null) {
      continue;
    }

    if (hasPower && nextOff === null && state === false) {
      nextOff = formatHalfHourIndex(nextIndex);
    }

    if (!hasPower && nextOn === null && state === true) {
      nextOn = formatHalfHourIndex(nextIndex);
    }

    if ((hasPower && nextOff !== null) || (!hasPower && nextOn !== null)) {
      break;
    }
  }

  return {
    has_power: hasPower,
    next_off: nextOff,
    next_on: nextOn,
  };
}
