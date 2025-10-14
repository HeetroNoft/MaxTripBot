import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import puppeteer from "puppeteer";
import fs from "fs-extra";
import { DateTime } from "luxon";
import path from "path";

const EMAIL = process.env.POLAR_EMAIL!;
const PASSWORD = process.env.POLAR_PASS!;
const TRIP_URL =
  "https://www.polarsteps.com/MaximeCrosne/22019906-australie?s=8b079af3-2be6-476e-9ba8-a83448df30c9&referral=true";

const PAYLOAD_FILE = path.resolve("./data/payload.json");

export const data = new SlashCommandBuilder()
  .setName("maxstep")
  .setDescription(
    "📍 Affiche la dernière position connue de Maxime sur Polarsteps"
  );

export const aliases = ["maxloc", "maxmap"];

export async function execute({ interaction }: any) {
  await interaction.deferReply();

  if (!EMAIL || !PASSWORD || !TRIP_URL) {
    return interaction.editReply(
      "❌ Configuration incomplète. Vérifie `POLAR_EMAIL`, `POLAR_PASS` et `POLAR_TRIP_URL` dans ton `.env`."
    );
  }

  try {
    let payload: any = null;

    // Vérifie si le fichier existe et sa date
    if (await fs.pathExists(PAYLOAD_FILE)) {
      const stats = await fs.stat(PAYLOAD_FILE);
      const ageInMs = Date.now() - stats.mtime.getTime();

      if (ageInMs < 1000 * 60 * 60) {
        // Moins d'une heure → on réutilise l'ancien payload
        payload = await fs.readJson(PAYLOAD_FILE);
      }
    }

    // Si pas de payload ou trop vieux, on récupère
    if (!payload) {
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
        } catch {}
      });

      await page.goto(TRIP_URL, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 4000));

      await browser.close();

      // Filtre pour ne garder que l'ID 22019906
      payload = payloads
        .map((p) => p?.trip || p)
        .find((p) => p?.id === 22019906);

      if (!payload) {
        return interaction.editReply(
          "😕 Impossible de trouver le voyage Polarsteps avec l'ID 22019906."
        );
      }

      // Sauvegarde (écrase l'ancien fichier)
      await fs.ensureDir("./data");
      await fs.writeJson(PAYLOAD_FILE, payload, { spaces: 2 });
    }

    // Dernière step
    const latestStep = (payload.steps || []).sort(
      (a: any, b: any) =>
        new Date(b.start_time || b.creation_time).getTime() -
        new Date(a.start_time || a.creation_time).getTime()
    )[0];

    if (!latestStep) {
      return interaction.editReply(
        "😕 Impossible de trouver la dernière step sur Polarsteps."
      );
    }

    const place = latestStep.location.full_detail || "Lieu inconnu";
    const date =
      latestStep.start_time || latestStep.creation_time || "Date inconnue";
    const dt = DateTime.fromISO(date, { zone: "Europe/Paris" });

    const description =
      latestStep.description || "Pas de description disponible.";
    const image =
      latestStep.media?.at(-1)?.path || latestStep.screenshot_url || null;

    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle("📍 Dernière position de Maxime")
      .setDescription(
        `**${place}**\n🗓️ ${dt.toFormat(
          "dd LLLL yyyy 'à' HH:mm:ss"
        )}\n\n${description}`
      )
      .setFooter({ text: "MaxTripBot • Données Polarsteps" });

    if (image) embed.setImage(image);

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("Erreur Polarsteps:", err);
    await interaction.editReply(
      "❌ Erreur lors de la récupération des données Polarsteps."
    );
  }
}
