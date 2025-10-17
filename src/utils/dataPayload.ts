import path from "path";
import puppeteer from "puppeteer";
import fs from "fs-extra";
import { DateTime, Zone } from "luxon";

const TRIP_URL = process.env.TRIP_URL;
const PAYLOAD_FILE = path.resolve("./data/payload.json");
/**
 * updatePayload
 * Charge le payload depuis le fichier local ou via Puppeteer si nécessaire.
 */
export async function updatePayload(): Promise<any | undefined> {
  try {
    // Vérifie si le fichier local est récent (moins de 10 min)
    if (await fs.pathExists(PAYLOAD_FILE)) {
      const stats = await fs.stat(PAYLOAD_FILE);
      const ageInMs = Date.now() - stats.mtime.getTime();
      if (ageInMs < 1000 * 60 * 10) {
        const localPayload = await fs.readJson(PAYLOAD_FILE);
        return localPayload;
      }
    }

    // --- 🔒 Vérification de TRIP_URL avant lancement ---
    const tripUrl = process.env.TRIP_URL?.trim();
    if (!tripUrl || !tripUrl.startsWith("http")) {
      throw new Error(`❌ URL TRIP_URL invalide ou manquante: "${tripUrl}"`);
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const payloads: any[] = [];

    page.on("response", async (resp) => {
      try {
        const ct = resp.headers()["content-type"] || "";
        if (!ct.includes("application/json")) return;
        const text = await resp.text();
        if (text.includes('"steps"') || text.includes('"trip"')) {
          payloads.push(JSON.parse(text));
        }
      } catch (err) {
        console.warn("Erreur interception JSON:", err);
      }
    });

    // --- Navigation sécurisée ---
    await page.goto(tripUrl, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 4000));
    await browser.close();

    const payload = payloads.map((p) => p?.trip || p).find((p) => p?.id === 22019906);

    if (!payload) {
      console.error("⚠️ Aucun payload trouvé pour le trip spécifié.");
      return undefined;
    }

    await fs.ensureDir("./data");
    await fs.writeJson(PAYLOAD_FILE, payload, { spaces: 2 });
    console.log("💾 Payload sauvegardé localement.");

    return payload;
  } catch (err) {
    console.error("❌ Erreur dans updatePayload:", err);
    return undefined;
  }
}

/**
 * getDataPayload
 * Récupère une clé spécifique depuis le payload.
 * @param dataPath Chemin dans le payload, ex: "location.full_detail"
 * @param latestOnly Si true, ne considère que la dernière step
 * @param refresh Si true, recharge le payload avant de récupérer les données
 */
export async function getDataPayload<T = unknown>(
  dataPath: string,
  latestOnly = false,
  refresh = true
): Promise<T | undefined> {
  try {
    let payload = await fs.readJson(PAYLOAD_FILE);
    if (refresh) payload = await updatePayload();
    if (!payload) return undefined;

    let useZelda = false;

    let target = payload;
    if (latestOnly) {
      const latestStep = (payload.steps || []).sort(
        (a: any, b: any) =>
          new Date(b.start_time || b.creation_time).getTime() -
          new Date(a.start_time || a.creation_time).getTime()
      )[0];

      // Récupérer les coordonnées depuis la dernière step via getDataPayload
      const lastStepLocality = latestStep.location.locality || null;
      const zeldaSteps = (await payload.zelda_steps) || [];

      let latestZelda: any = null;
      if (zeldaSteps.length > 0) {
        latestZelda = zeldaSteps
          .map((z: any) => ({ ...z, dt: DateTime.fromISO(z.time) }))
          .sort((a: any, b: any) => b.dt.toMillis() - a.dt.toMillis())[0];

        const latestZeldaLocality = latestZelda.location.locality || null;

        if (lastStepLocality === latestZeldaLocality) {
          useZelda = false;
        } else {
          useZelda = true;
          console.warn("lastStepLocality !== latestZeldaLocality, utilisation de Zelda");
        }
      }
      if (!latestStep) {
        console.error("Aucune step trouvée.");
        return undefined;
      }

      target = latestStep;
      if (useZelda && latestZelda) {
        target = latestZelda;
      }
    }

    // Gestion spéciale pour nb_country
    if (!dataPath) {
      console.error("Pas de clé demandée fournie à getDataPayload");
      return undefined;
    }

    if (dataPath === "nb_country") {
      return nbCountry(payload) as any;
    }

    if (dataPath === "flag_countries") {
      return flagCountries(payload) as any;
    }

    if (dataPath === "nb_steps") {
      return payload.steps.length as any;
    }

    if (dataPath === "timeSinceUpdate") {
      return lastSinceUpdate(payload) as any;
    }

    const keys = dataPath
      .replace(/\[(\w+)\]/g, ".$1")
      .split(".")
      .filter(Boolean);
    let result: any = target;

    for (const key of keys) {
      if (result && key in result) {
        result = result[key];
      } else {
        console.error(`Clé non trouvée: ${key}`);
        return undefined;
      }
    }

    return result as T;
  } catch (err) {
    console.error("Erreur dans getDataPayload:", err);
    return undefined;
  }
}

function nbCountry(payload: { zelda_steps: any[] }): number {
  const zSteps = payload.zelda_steps || [];
  const countries = new Set<string>();
  for (const step of zSteps) {
    const country = step?.location?.country;
    if (country && country !== "") countries.add(country);
  }
  return countries.size as any;
}

function flagCountries(payload: { zelda_steps: any[] }): string {
  const zSteps = payload.zelda_steps || [];
  const countries = new Set<string>();

  for (const step of zSteps) {
    const countryCode = step?.location?.country_code;
    // Vérification : au moins une lettre et aucun chiffre
    if (countryCode && /^[A-Za-z]+$/.test(countryCode) && countryCode.length >= 1) {
      countries.add(countryCode.toUpperCase());
    }
  }

  const flags = [...countries]
    .map((countryCode) => {
      const codePoints = [...countryCode].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
      return String.fromCodePoint(...codePoints);
    })
    .join(" ");

  return flags as any;
}

function lastSinceUpdate(payload: {
  last_modified: null;
  timezone_id: string | Zone<boolean> | undefined;
}): string {
  const lastModified = payload.last_modified || (null as any);

  const last = DateTime.fromISO(lastModified, {
    zone: payload.timezone_id,
  });
  const now = DateTime.now().setZone(payload.timezone_id);

  const diff = now.diff(last, ["days", "hours", "minutes"]).toObject();

  if (diff.days && diff.days >= 1) {
    return `${Math.floor(diff.days)}j` as any;
  } else if (diff.hours && diff.hours >= 1) {
    return `${Math.floor(diff.hours)}h` as any;
  } else if (diff.minutes && diff.minutes >= 1) {
    return `${Math.floor(diff.minutes)}min` as any;
  } else {
    return "quelques secondes" as any;
  }
}
