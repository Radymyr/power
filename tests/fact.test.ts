import { describe, expect, it } from "vitest";
import { resolveActualFactDay } from "../src/fact.js";
import type { FactCollection } from "../src/types.js";

describe("resolveActualFactDay", () => {
  it("finds fact key for Kyiv local day", () => {
    const factData: FactCollection = {
      "1768428000": {
        "GPV2.1": {
          "1": "yes",
        },
      },
    };

    const result = resolveActualFactDay(
      factData,
      new Date("2026-01-15T10:00:00.000Z"),
      "Europe/Kyiv",
    );

    expect(result.key).toBe("1768428000");
    expect(result.day).toEqual(factData["1768428000"]);
  });

  it("falls back to nearest key when exact key is missing", () => {
    const factData: FactCollection = {
      "1768341600": {
        "GPV2.1": {
          "1": "no",
        },
      },
    };

    const result = resolveActualFactDay(
      factData,
      new Date("2026-01-15T10:00:00.000Z"),
      "Europe/Kyiv",
    );

    expect(result.key).toBe("1768341600");
  });
});
