import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
  getMaxLoveCount,
  getMaxLoveLeaderboard,
} from "../../utils/maxLoveManager";
import { getDataPayload } from "../../utils/dataPayload";
import { DateTime } from "luxon";

export const data = new SlashCommandBuilder()
  .setName("maxstats")
  .setDescription("Affiche les statistiques du voyage de Maxime");

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
  try {
    // Récupérer la distance totale via getDataPayload
    const totalDistanceRaw = await getDataPayload<number>("total_km");
    const totalDistance = totalDistanceRaw?.toFixed(1) || "Distance inconnue";

    const totalCountries = await getDataPayload<number>("nb_country");

    const totalSteps = await getDataPayload<number>("nb_steps");
    const allFlags = await getDataPayload<string[]>("flag_countries");

    const departISO = process.env.MAX_DEPART as string;
    const nowParis = DateTime.now().setZone("Europe/Paris");
    const today = nowParis.startOf("day");
    const departDate = DateTime.fromISO(departISO, {
      zone: "Europe/Paris",
    }).startOf("day");
    let diffDays = Math.floor(today.diff(departDate, "days").days) + " jours";
    if (diffDays === "0 jours") {
      diffDays = "Aujourd'hui";
    }

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
        `**📅 Nombre de jours depuis le départ :** ${diffDays}\n\n**📏 Kilomètres parcourus :** ${totalDistance}km\n\n**🎯 Nombre d'étapes :** ${totalSteps}\n\n**🌍 Nombre de pays visités :** ${totalCountries}\n${allFlags}\n\n**💗 Total de MaxLove envoyés :** ${totalMaxLove}\n\n**🏆 Top 5 MaxLove :**\n${topMaxLove}`
      )
      .setFooter({
        text: "MaxTripBot • Stats",
      });

    if (interaction) await interaction.reply({ embeds: [embed] });
    else if (message) await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Erreur lors de la récupération des MaxStats :", error);
    if (interaction)
      await interaction.reply("❌ Impossible de récupérer les statistiques.");
    else if (message)
      await message.reply("❌ Impossible de récupérer les statistiques.");
  }
}
