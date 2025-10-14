import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
  getMaxLoveCount,
  getMaxLoveLeaderboard,
} from "../../utils/maxLoveManager";
import fs from "fs-extra";
import path from "path";

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
  const PAYLOAD_FILE = path.resolve("./data/payload.json");

  const totalDistance =
    (await fs.readJson(PAYLOAD_FILE)).total_km.toFixed(1) ||
    "Distance inconnue";
  const totalMaxLove = getMaxLoveCount();
  const leaderboard = getMaxLoveLeaderboard();

  // Trier les utilisateurs par score décroissant
  const sorted = [...leaderboard].sort((a, b) => b[1] - a[1]);

  // Différents cœurs pour les 3 premiers
  const hearts = ["💗", "💖", "💘", "💞", "💕"];

  // Créer un top 5 formaté
  const topMaxLove =
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
    .setTitle("📊 MaxStats")
    .setDescription(
      `**📏 Kilomètres parcourus :** ${totalDistance}km\n\n**💗 Total de MaxLove envoyés :** ${totalMaxLove}\n\n**🏆 Top 5 MaxLove :**\n${topMaxLove}`
    )
    .setFooter({
      text: "MaxTripBot • Stats",
    });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
