import { describe, expect, it, vi } from "vitest";
import handler from "../api/power.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

vi.mock("../src/dtek-client.js", () => ({
  fetchDtekData: vi.fn(async () => ({
    data: {
      "22": {
        sub_type_reason: ["GPV2.1"],
      },
    },
    fact: {
      data: {
        "1768428000": {
          "GPV2.1": {
            "1": "first",
            "24": "no",
          },
        },
      },
    },
  })),
}));

function createMockResponse() {
  const payload: { statusCode: number | null; body: unknown } = {
    statusCode: null,
    body: null,
  };

  const res = {
    status(code: number) {
      payload.statusCode = code;
      return this;
    },
    json(body: unknown) {
      payload.body = body;
      return this;
    },
  } as unknown as VercelResponse;

  return { res, payload };
}

describe("api/power handler", () => {
  it("returns status with next_on for midnight boundary scenario", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-15T21:50:00.000Z")); // 23:50 Kyiv

      const req = {
        query: {
          city: "м. Кам’янське",
          street: "вул. Архітектурна",
          house: "22",
        },
      } as unknown as VercelRequest;

      const { res, payload } = createMockResponse();
      await handler(req, res);

      expect(payload.statusCode).toBe(200);
      expect(payload.body).toMatchObject({
        ok: true,
        sub_type_reason: "GPV2.1",
        fact_day_key: "1768428000",
        current_status: {
          has_power: false,
          next_on: "00:30",
        },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns 400 when house is missing", async () => {
    const req = {
      query: {
        city: "м. Кам’янське",
        street: "вул. Архітектурна",
      },
    } as unknown as VercelRequest;

    const { res, payload } = createMockResponse();
    await handler(req, res);

    expect(payload.statusCode).toBe(400);
    expect(payload.body).toMatchObject({
      ok: false,
    });
    expect(payload.body).toHaveProperty("error");
  });
});
