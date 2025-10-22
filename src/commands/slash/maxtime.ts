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

export async function execute({ interaction, message }: { interaction?: any; message?: any }) {
  const [timezoneId, country, slug, locality, countryCode, steps] = await Promise.all([
    getDataPayload<string>("timezone_id", true),
    getDataPayload<string>("location.country", false),
    getDataPayload<string>("slug", false),
    getDataPayload<string>("location.locality", false),
    getDataPayload<string>("location.country_code", false),
    getDataPayload<any>("steps", false),
  ]);

  const latestStep = (steps || []).sort(
    (a: any, b: any) =>
      new Date(b.start_time || b.creation_time).getTime() -
      new Date(a.start_time || a.creation_time).getTime()
  )[0];

  // Normalisation pour éviter undefined
  const tz = timezoneId ?? latestStep.location.country == country ? latestStep.timezone_id : null;
  const locCountry = country ?? "Lieu inconnu";
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
    location: locCountry,
    city,
  });

  const embed = new EmbedBuilder()
    .setColor(ThemeColors.Info)
    .setTitle("⏰ Heures actuelles")
    .setDescription(
      `**🇫🇷 France (Paris) :** ${franceTime.toFormat("HH:mm")}\n` +
        `**${flag} ${locCountry}${city ? ` (${city})` : ""} :** ${
          maxTime ? maxTime.toFormat("HH:mm") : "aucune donnée"
        }\n\n` +
        `Différence de temps : ${diffHours > 0 ? "+" : ""}${diffHours}h`
    )
    .setFooter({ text: "MaxTripBot • Time Info" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
