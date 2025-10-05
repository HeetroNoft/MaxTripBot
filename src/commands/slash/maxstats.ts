import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
  getMaxLoveCount,
  getMaxLoveLeaderboard,
} from "../../utils/maxLoveManager";

export const data = new SlashCommandBuilder()
  .setName("maxstats")
  .setDescription("Affiche le nombre de MaxLove envoyés");

export const aliases = ["maxstats"];

export async function execute({
  interaction,
  message,
  client,
}: {
  interaction?: any;
  message?: any;
  client: any;
}) {
  const total = getMaxLoveCount();
  const leaderboard = getMaxLoveLeaderboard();

  const description = leaderboard
    .map(([userId, count], i) => `${i + 1}. <@${userId}> : **${count}**`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor(0x00ffff)
    .setTitle("📊 MaxStats")
    .setDescription(
      `**Total MaxLove : ${total}**\n\n**Top utilisateurs :**\n${
        description || "Aucun MaxLove pour le moment !"
      }`
    )
    .setFooter({ text: "MaxTripBot • Stats MaxLove" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
