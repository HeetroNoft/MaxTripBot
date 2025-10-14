import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import { getDataPayload } from "../../utils/dataPayload";

export const data = new SlashCommandBuilder()
  .setName("maxtime")
  .setDescription("Affiche l'heure Australie / France et la différence");

export const aliases = ["maxtime"];

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
  const maxTime = DateTime.now().setZone(
    await getDataPayload("timezone_id", true)
  );
  const maxLocation =
    (await getDataPayload("location.country", true)) || "Lieu inconnu";
  const countryCode =
    (await getDataPayload<string>("location.country_code", true)) || "";
  const maxCountryFlag = countryCodeToFlagEmoji(countryCode);

  // Calcul de la différence de temps en heures
  let diffHours = maxTime.offset - franceTime.offset; // offset en minutes
  diffHours = diffHours / 60; // convertir en heures

  const embed = new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle("⏰ Heures actuelles")
    .setDescription(
      `🇫🇷 France (Paris) : ${franceTime.toFormat("HH:mm")}\n` +
        `${maxCountryFlag} ${maxLocation} : ${maxTime.toFormat("HH:mm")}\n` +
        `\nDifférence de temps : ${diffHours > 0 ? "+" : ""}${diffHours}h`
    )
    .setFooter({ text: "MaxTripBot • Time Info" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
