import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import { getDataPayload } from "../../utils/dataPayload";

export const data = new SlashCommandBuilder()
  .setName("maxtime")
  .setDescription(
    "Affiche l'heure de la dernière position connue de Maxime / France et la différence"
  );

export const aliases = ["maxtime ", "maxheure"];

function countryCodeToFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🏳️"; // drapeau blanc par défaut
  // Convertir chaque lettre en "Regional Indicator Symbol"
  const codePoints = [...countryCode.toUpperCase()].map(
    (char) => 0x1f1e6 + char.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...codePoints);
}

export async function execute({
  interaction,
  message,
}: {
  interaction?: any;
  message?: any;
}) {
  const franceTime = DateTime.now().setZone("Europe/Paris");
  let maxTime = null as any;
  if (await getDataPayload("timezone_id", true)) {
    maxTime = DateTime.now().setZone(await getDataPayload("timezone_id", true));
  }
  const maxLocation =
    (await getDataPayload("location.country", true)) || "Lieu inconnu";
  const rawSlug = await getDataPayload("slug", true);
  const maxLocationCity =
    typeof rawSlug === "string" && rawSlug.length > 0
      ? rawSlug.replace(/^./, (str) => str.toUpperCase())
      : (await getDataPayload("location.locality", true)) || null;
  const countryCode =
    (await getDataPayload<string>("location.country_code", true)) || "";
  const maxCountryFlag = countryCodeToFlagEmoji(countryCode);

  // Calcul de la différence de temps en heures
  let diffHours = 0; // convertir en heures
  if (maxTime) {
    diffHours = maxTime.offset - franceTime.offset; // offset en minutes
    diffHours = diffHours / 60;
  }

  const embed = new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle("⏰ Heures actuelles")
    .setDescription(
      `**🇫🇷 France (Paris) :** ${franceTime.toFormat("HH:mm")}\n` +
        `**${maxCountryFlag} ${maxLocation} ${
          maxLocationCity ? `(${maxLocationCity})` : ""
        } :** ${maxTime ? maxTime.toFormat("HH:mm") : "aucune donnée"}\n` +
        `\nDifférence de temps : ${diffHours > 0 ? "+" : ""}${diffHours}h`
    )
    .setFooter({ text: "MaxTripBot • Time Info" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
