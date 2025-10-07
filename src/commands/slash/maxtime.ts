import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";

export const data = new SlashCommandBuilder()
  .setName("maxtime")
  .setDescription("Affiche l'heure Australie / France et la différence");

export const aliases = ["maxtime"];

export async function execute({
  interaction,
  message,
}: {
  interaction?: any;
  message?: any;
}) {
  const franceTime = DateTime.now().setZone("Europe/Paris");
  const australiaTime = DateTime.now().setZone("Australia/Perth");

  // Calcul de la différence de temps en heures
  let diffHours = australiaTime.offset - franceTime.offset; // offset en minutes
  diffHours = diffHours / 60; // convertir en heures

  const embed = new EmbedBuilder()
    .setColor(0x1e90ff)
    .setTitle("⏰ Heures actuelles")
    .setDescription(
      `🇫🇷 France (Paris) : ${franceTime.toFormat("HH:mm")}\n` +
        `🇦🇺 Australie (Perth) : ${australiaTime.toFormat("HH:mm")}\n` +
        `\nDifférence de temps : ${diffHours > 0 ? "+" : ""}${diffHours}h`
    )
    .setFooter({ text: "MaxTripBot • Time Info" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
