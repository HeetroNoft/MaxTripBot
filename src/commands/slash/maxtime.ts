import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import { getDataPayload } from "../../utils/dataPayload";
import { ThemeColors } from "../../utils/theme";

export const data = new SlashCommandBuilder()
  .setName("maxtime")
  .setDescription(
    "Affiche l'heure de la dernière position connue de Maxime / France et la différence"
  );

export const aliases = ["maxtime", "maxheure"];

function countryCodeToFlagEmoji(code: string | null): string {
  if (!code || code.length !== 2) return "🏳️";
  const offset = 0x1f1e6 - 65;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => offset + c.charCodeAt(0))
  );
}

async function getTimezone(lat: number | undefined, lon: number | undefined) {
  if (!lat || !lon) return undefined;
  const url = `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur lors de la récupération du fuseau horaire");
  const data = await res.json();
  return data.timeZone; // Exemple: "Europe/Paris"
}

export async function execute({ interaction, message }: { interaction?: any; message?: any }) {
  const [timezoneId, country, slug, locality, countryCode] = await Promise.all([
    getDataPayload<string>("timezone_id", true),
    getDataPayload<string>("location.country", false),
    getDataPayload<string>("slug", false),
    getDataPayload<string>("location.locality", false),
    getDataPayload<string>("location.country_code", false),
  ]);
  const [maxLat, maxLon] = await Promise.all<any>([
    getDataPayload<string>("location.lat", false),
    getDataPayload<string>("location.lon", false),
  ]);

  // Normalisation pour éviter undefined
  const fetchTz = maxLat || maxLon ? getTimezone(maxLat, maxLon) : null;
  const tz = timezoneId ?? null;
  const countryValue = country ?? "Lieu inconnu";
  const slugValue = slug ?? "";
  const localityValue = locality ?? "";
  const cc = countryCode ?? null;

  const franceTime = DateTime.now().setZone("Europe/Paris");
  const maxTime = tz ? DateTime.now().setZone(tz) : null;
  const city =
    slugValue.length > 0 ? slugValue.replace(/^./, (s) => s.toUpperCase()) : localityValue || null;
  const flag = countryCodeToFlagEmoji(cc);

  const diffHours = maxTime ? (maxTime.offset - franceTime.offset) / 60 : 0;

  const now = new Date().toLocaleString("fr-FR");
  console.log(`📦 [${now}] (/maxtime) Données temps :`, {
    france: franceTime.toFormat("HH:mm"),
    max: maxTime?.toFormat("HH:mm") ?? "aucune donnée",
    diff: diffHours,
    flag,
    location: countryValue,
    city,
  });

  const embed = new EmbedBuilder()
    .setColor(ThemeColors.Info)
    .setTitle("⏰ Heures actuelles")
    .setDescription(
      `**🇫🇷 France (Paris) :** ${franceTime.toFormat("HH:mm")}\n` +
        `**${flag} ${countryValue}${city ? ` (${city})` : ""} :** ${
          maxTime ? maxTime.toFormat("HH:mm") : "aucune donnée"
        }\n\n` +
        `Différence de temps : ${diffHours > 0 ? "+" : ""}${diffHours}h`
    )
    .setFooter({ text: "MaxTripBot • Time Info" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
