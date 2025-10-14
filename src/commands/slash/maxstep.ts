import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import puppeteer from "puppeteer";
import fs from "fs-extra";

const EMAIL = process.env.POLAR_EMAIL!;
const PASSWORD = process.env.POLAR_PASS!;
const TRIP_URL =
  "https://www.polarsteps.com/MaximeCrosne/22019906-australie?s=8b079af3-2be6-476e-9ba8-a83448df30c9&referral=true";

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
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const payloads: any[] = [];

    page.on("response", async (resp) => {
      try {
        const url = resp.url();
        const ct = resp.headers()["content-type"] || "";
        if (!ct.includes("application/json")) return;

        const text = await resp.text();
        if (text.includes('"steps"') || text.includes('"trip"')) {
          const json = JSON.parse(text);
          payloads.push({ url, json });
        }
      } catch {}
    });

    // Aller sur la page de connexion
    await page.goto("https://www.polarsteps.com/login", {
      waitUntil: "networkidle2",
    });

    // Remplir email
    await page.waitForSelector(
      'input[type="email"], input[name="email"], input[name="username"]',
      { timeout: 10000 }
    );
    await page.type(
      'input[type="email"], input[name="email"], input[name="username"]',
      EMAIL,
      { delay: 50 }
    );

    // Remplir mot de passe
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', PASSWORD, { delay: 50 });

    // Trouver un bouton de connexion valide
    const possibleButtons = [
      'button[type="submit"]',
      'button[data-testid="login-button"]',
      'button[class*="login"]',
      'button[class*="submit"]',
    ];

    let buttonFound = false;
    for (const selector of possibleButtons) {
      const btn = await page.$(selector);
      if (btn) {
        await Promise.all([
          btn.click(),
          page
            .waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })
            .catch(() => {}),
        ]);
        buttonFound = true;
        break;
      }
    }

    if (!buttonFound) {
      await browser.close();
      return interaction.editReply(
        "❌ Impossible de trouver le bouton de connexion sur Polarsteps."
      );
    }

    // Accéder au voyage
    await page.goto(TRIP_URL, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Sauvegarde des payloads pour debug
    await fs.ensureDir("./polarsteps-output");
    const outputFile = `./polarsteps-output/payloads-${Date.now()}.json`;
    await fs.writeJson(outputFile, payloads, { spaces: 2 });

    // Extraire la dernière étape
    const latestStep = payloads
      .flatMap((p) => p.json?.trip?.steps || p.json?.data?.trip?.steps || [])
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b.startDate || b.date).getTime() -
          new Date(a.startDate || a.date).getTime()
      )[0];

    if (!latestStep) {
      await browser.close();
      return interaction.editReply(
        "😕 Impossible de trouver la dernière position sur Polarsteps."
      );
    }

    const place = latestStep.location?.name || "Lieu inconnu";
    const country = latestStep.location?.country || "";
    const date = latestStep.startDate || latestStep.date || "Date inconnue";
    const description = latestStep.text || "Pas de description disponible.";
    const image = latestStep.coverPhoto?.url || null;

    // Création de l'embed Discord
    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle("📍 Dernière position de Maxime")
      .setDescription(`**${place}**, ${country}\n🗓️ ${date}\n\n${description}`)
      .setFooter({ text: "MaxTripBot • Données Polarsteps" });

    if (image) embed.setImage(image);

    await browser.close();
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("Erreur Polarsteps:", err);
    await interaction.editReply(
      "❌ Erreur lors de la récupération des données Polarsteps."
    );
  }
}
