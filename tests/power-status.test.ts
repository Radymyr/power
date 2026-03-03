import { describe, expect, it } from "vitest";
import { getCurrentPowerStatus } from "../src/power-status.js";
import type { DaySchedule, FactDay } from "../src/types.js";

function createSchedule(
  defaultValue: DaySchedule[string],
  overrides: Record<number, DaySchedule[string]>,
): DaySchedule {
  const schedule: DaySchedule = {};
  for (let hour = 1; hour <= 24; hour += 1) {
    schedule[String(hour)] = defaultValue;
  }
  for (const [hour, value] of Object.entries(overrides)) {
    schedule[hour] = value;
  }
  return schedule;
}

function wrapOutages(schedule: DaySchedule): FactDay {
  return {
    "GPV2.1": schedule,
  };
}

describe("getCurrentPowerStatus", () => {
  it("returns next_on across midnight when current slot is off", () => {
    const schedule = createSchedule("yes", {
      24: "no",
      1: "first",
    });
    const outages = wrapOutages(schedule);

    const result = getCurrentPowerStatus(outages, {
      now: new Date("2026-01-15T21:50:00.000Z"), // 23:50 Europe/Kyiv
      timeZone: "Europe/Kyiv",
      typeReason: "GPV2.1",
    });

    expect(result).toEqual({
      has_power: false,
      next_off: null,
      next_on: "00:30",
    });
  });

  it("returns next_off across midnight when light is on", () => {
    const schedule = createSchedule("yes", {
      1: "second",
    });
    const outages = wrapOutages(schedule);

    const result = getCurrentPowerStatus(outages, {
      now: new Date("2026-01-15T21:50:00.000Z"), // 23:50 Europe/Kyiv
      timeZone: "Europe/Kyiv",
      typeReason: "GPV2.1",
    });

    expect(result).toEqual({
      has_power: true,
      next_off: "00:30",
      next_on: null,
    });
  });
});
