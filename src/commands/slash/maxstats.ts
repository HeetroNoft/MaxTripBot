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

  // Trier les utilisateurs par score décroissant
  const sorted = [...leaderboard].sort((a, b) => b[1] - a[1]);

  // Différents cœurs pour les 3 premiers
  const hearts = ["💗", "💖", "💘", "💞", "💕"];

  // Créer un top 5 formaté
  const top =
    sorted.length > 0
      ? sorted
          .slice(0, 5)
          .map(
            ([user, score], i) =>
              `**${i + 1}.** <@${user}> — ${score} ${hearts[i] ?? "❤️"}`
          )
          .join("\n")
      : "Aucun MaxLove pour le moment 😢";

  const embed = new EmbedBuilder()
    .setColor(0xff66cc)
    .setTitle("📊 MaxStats — Classement des MaxLove 💘")
    .setDescription(
      `**Total de MaxLove envoyés : ${total} ❤️**\n\n🏆 **Top 5 utilisateurs :**\n${top}`
    )
    .setFooter({
      text: "MaxTripBot • Stats MaxLove",
    });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
