import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import path from "path";
import puppeteer from "puppeteer";
import fs from "fs-extra";

/**
 * getDataPayload
 * Récupère la data Polarsteps depuis un fichier local ou en ligne via Puppeteer.
 * @param dataPath Chemin dans le payload, ex: "location.full_detail"
 * @param latestOnly Si true, ne considère que la dernière step
 */

export async function getDataPayload<T = unknown>(
  dataPath: string,
  latestOnly = false
): Promise<T | undefined> {
  const TRIP_URL =
    "https://www.polarsteps.com/MaximeCrosne/22019906-australie?s=8b079af3-2be6-476e-9ba8-a83448df30c9&referral=true";
  const PAYLOAD_FILE = path.resolve("./data/payload.json");

  let payload: any = null;

  try {
    if (await fs.pathExists(PAYLOAD_FILE)) {
      const stats = await fs.stat(PAYLOAD_FILE);
      const ageInMs = Date.now() - stats.mtime.getTime();

      if (ageInMs < 1000 * 60 * 60) {
        payload = await fs.readJson(PAYLOAD_FILE);
        console.log("Payload chargé depuis le fichier local.");
      }
    }

    if (!payload) {
      console.log("Chargement du payload via Puppeteer...");
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
            console.log("Payload JSON intercepté via Puppeteer.");
          }
        } catch {}
      });

      await page.goto(TRIP_URL, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 4000));
      await browser.close();

      payload = payloads
        .map((p) => p?.trip || p)
        .find((p) => p?.id === 22019906);

      if (!payload) {
        console.error("Aucun payload trouvé pour le trip spécifié.");
        return undefined;
      }

      await fs.ensureDir("./data");
      await fs.writeJson(PAYLOAD_FILE, payload, { spaces: 2 });
      console.log("Payload sauvegardé localement.");
    }

    if (latestOnly) {
      const latestStep = (payload.steps || []).sort(
        (a: any, b: any) =>
          new Date(b.start_time || b.creation_time).getTime() -
          new Date(a.start_time || a.creation_time).getTime()
      )[0];
      if (!latestStep) {
        console.error("Aucune step trouvée.");
        return undefined;
      }
      payload = latestStep;
    }

    const keys = dataPath
      .replace(/\[(\w+)\]/g, ".$1")
      .split(".")
      .filter(Boolean);

    let result: any = payload;
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
