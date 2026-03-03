import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium, type Page } from "playwright-core";
import type { FactCollection } from "./types.js";

const DTEK_URL = "https://www.dtek-dnem.com.ua/ua/shutdowns";

interface FetchDtekParams {
  city: string;
  street: string;
}

interface DtekAjaxResponse {
  data: Record<string, unknown>;
  fact: {
    data: FactCollection;
  };
}

async function waitForCsrfToken(page: Page, timeoutMs = 15_000): Promise<string> {
  await page.waitForLoadState("domcontentloaded");

  const token = await page
    .waitForFunction(
      () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta?.getAttribute("content")) return meta.getAttribute("content");
        const win = window as Window & {
          _csrfToken?: string;
          csrfToken?: string;
        };
        if (typeof win._csrfToken === "string" && win._csrfToken.length > 0) {
          return win._csrfToken;
        }
        if (typeof win.csrfToken === "string" && win.csrfToken.length > 0) {
          return win.csrfToken;
        }
        const cookieMap = document.cookie.split("; ").reduce<Record<string, string>>((acc, chunk) => {
          const [name, value] = chunk.split("=");
          if (name && value) acc[name] = value;
          return acc;
        }, {});
        return cookieMap._csrf ?? cookieMap["XSRF-TOKEN"] ?? cookieMap.csrf ?? null;
      },
      { timeout: timeoutMs },
    )
    .catch(() => null);

  if (!token) {
    throw new Error("CSRF token not found after waiting");
  }

  const value = await token.jsonValue();
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("CSRF token is empty");
  }

  return value;
}

async function postDtekAjax(
  page: Page,
  csrfToken: string,
  bodyStr: string,
): Promise<string> {
  return page.evaluate(
    async ({ token, body }) => {
      const response = await fetch("/ua/ajax", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": token,
        },
        body,
      });
      return response.text();
    },
    { token: csrfToken, body: bodyStr },
  );
}

export async function fetchDtekData(
  params: FetchDtekParams,
): Promise<DtekAjaxResponse> {
  let browser;
  try {
    browser = await playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    const page = await context.newPage();
    await page.goto(DTEK_URL, { waitUntil: "domcontentloaded" });

    const csrfToken = await waitForCsrfToken(page);

    const body = new URLSearchParams();
    body.append("method", "getHomeNum");
    body.append("data[0][name]", "city");
    body.append("data[0][value]", params.city);
    body.append("data[1][name]", "street");
    body.append("data[1][value]", params.street);
    body.append("data[2][name]", "updateFact");
    body.append("data[2][value]", new Date().toLocaleString("uk-UA"));

    let rawResponse = "";
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        rawResponse = await postDtekAjax(page, csrfToken, body.toString());
        const parsed = JSON.parse(rawResponse) as DtekAjaxResponse;
        return parsed;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error("Unknown AJAX error");
        await page.waitForTimeout(500 * attempt);
      }
    }

    throw new Error(
      `Invalid DTEK response after retries: ${
        lastError?.message ?? rawResponse.slice(0, 200)
      }`,
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
