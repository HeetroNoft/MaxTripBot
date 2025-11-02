import path from "path";
import puppeteer from "puppeteer";
import fs from "fs-extra";
import { DateTime, Zone } from "luxon";

const TRIP_URL = process.env.TRIP_URL;
const PAYLOAD_FILE = path.resolve("./data/payload.json");

interface Location {
  locality?: string;
  country?: string;
  country_code?: string;
}

interface Step {
  id?: number;
  start_time?: string;
  creation_time?: string;
  location?: Location;
  [key: string]: any;
}

interface ZeldaStep {
  time: string;
  location?: Location;
  [key: string]: any;
}

interface Payload {
  id?: number;
  steps?: Step[];
  zelda_steps?: ZeldaStep[];
  last_modified?: string | null;
  timezone_id?: string | Zone<boolean>;
  [key: string]: any;
}

// --- updatePayload ---
export async function updatePayload(): Promise<Payload | undefined> {
  try {
    if (await fs.pathExists(PAYLOAD_FILE)) {
      const stats = await fs.stat(PAYLOAD_FILE);
      if (Date.now() - stats.mtime.getTime() < 10 * 60 * 1000) {
        return await fs.readJson(PAYLOAD_FILE);
      }
    }

    const tripUrl = TRIP_URL?.trim();
    if (!tripUrl?.startsWith("http")) throw new Error(`URL TRIP_URL invalide: "${tripUrl}"`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--single-process",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
      ],
    });

    const page = await browser.newPage();

    let payload: Payload | undefined;

    page.on("response", async (resp) => {
      try {
        const ct = resp.headers()["content-type"] || "";
        if (!ct.includes("application/json")) return;
        const text = await resp.text();
        if (text.includes('"steps"') || text.includes('"trip"')) {
          const parsed = JSON.parse(text);
          if (!payload) payload = parsed?.trip || parsed;
        }
      } catch {}
    });

    await page.goto(tripUrl, { waitUntil: "networkidle2" });
    await new Promise((resolve) => setTimeout(resolve, 2000)); // compatible TS strict
    await page.close();
    await browser.close();

    if (!payload) return undefined;

    await fs.ensureDir("./data");
    await fs.writeJson(PAYLOAD_FILE, payload, { spaces: 2 });

    return payload;
  } catch (err) {
    console.error("Erreur updatePayload:", err);
    return undefined;
  }
}

// --- getDataPayload ---
export async function getDataPayload<T = unknown>(
  dataPath: string,
  latestOnly = false,
  refresh = true
): Promise<T | undefined> {
  try {
    let payload: Payload | undefined = refresh
      ? await updatePayload()
      : await fs.readJson(PAYLOAD_FILE);
    if (!payload) return undefined;

    let target: any = payload;

    if (latestOnly) {
      const steps: Step[] = payload.steps || [];
      if (!steps.length) return undefined;

      const latestStep = steps.reduce((a: Step, b: Step) => {
        const ta = new Date(a.start_time ?? a.creation_time ?? 0).getTime();
        const tb = new Date(b.start_time ?? b.creation_time ?? 0).getTime();
        return tb > ta ? b : a;
      });

      const zSteps: ZeldaStep[] = payload.zelda_steps || [];
      const latestZelda: ZeldaStep | null = zSteps.length
        ? zSteps.reduce((a: ZeldaStep, b: ZeldaStep) => {
            const ta = DateTime.fromISO(a.time).toMillis();
            const tb = DateTime.fromISO(b.time).toMillis();
            return tb > ta ? b : a;
          })
        : null;

      const lastLocality = latestStep.location?.locality;
      const zLocality = latestZelda?.location?.locality;
      const useZelda = latestZelda && lastLocality !== zLocality;

      target = useZelda && latestZelda ? latestZelda : latestStep;
    }

    if (!dataPath) return undefined;

    if (dataPath === "nb_country") return nbCountry(payload) as any;
    if (dataPath === "flag_countries") return flagCountries(payload) as any;
    if (dataPath === "nb_steps") return payload.steps?.length as any;
    if (dataPath === "timeSinceUpdate") return lastSinceUpdate(payload) as any;

    if (dataPath === "start_time" && target?.time) dataPath = "time";

    const keys = dataPath
      .replace(/\[(\w+)\]/g, ".$1")
      .split(".")
      .filter(Boolean);
    let result: any = target;

    for (const key of keys) {
      if (result?.[key] !== undefined) result = result[key];
      else return undefined;
    }

    return result as T;
  } catch (err) {
    console.error("Erreur getDataPayload:", err);
    return undefined;
  }
}

// --- Helpers ---
function nbCountry(payload: Payload): number {
  return new Set((payload.zelda_steps || []).map((s) => s?.location?.country).filter(Boolean)).size;
}

function flagCountries(payload: Payload): string {
  const codes = new Set(
    (payload.zelda_steps || [])
      .map((s) => s?.location?.country_code)
      .filter((c): c is string => typeof c === "string" && /^[A-Za-z]+$/.test(c))
      .map((c) => c.toUpperCase())
  );
  return [...codes]
    .map((c) => [...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))
    .map((arr) => String.fromCodePoint(...arr))
    .join(" ");
}

function lastSinceUpdate(payload: Payload): string {
  const last = payload.last_modified
    ? DateTime.fromISO(payload.last_modified, { zone: payload.timezone_id })
    : DateTime.now();
  const diff = DateTime.now()
    .setZone(payload.timezone_id)
    .diff(last, ["days", "hours", "minutes"])
    .toObject();
  if (diff.days && diff.days >= 1) return `${Math.floor(diff.days)}j`;
  if (diff.hours && diff.hours >= 1) return `${Math.floor(diff.hours)}h`;
  if (diff.minutes && diff.minutes >= 1) return `${Math.floor(diff.minutes)}min`;
  return "quelques secondes";
}
