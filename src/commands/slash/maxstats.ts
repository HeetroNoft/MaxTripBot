import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import {
  getMaxLoveCount,
  getMaxLoveLeaderboard,
  getMaxLoveStatsPerDay,
  getRank,
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
    if (interaction) await interaction.deferReply();

    // Récupérer les données
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
    if (diffDays === "0 jours") diffDays = "Aujourd'hui";

    const totalMaxLove = getMaxLoveCount();
    const leaderboard = getMaxLoveLeaderboard();

    const sorted = [...leaderboard].sort((a, b) => b[1] - a[1]);
    const hearts = ["💗", "💖", "💘", "💞", "💕"];

    let topMaxLove = "Aucun MaxLove pour le moment 😢";
    if (sorted.length > 0) {
      // 🔹 résoudre les async avec Promise.all
      const topPromises = sorted.slice(0, 5).map(async ([user, score], i) => {
        const rank = await getRank(score); // si getRank est async
        return `**${i + 1}.** <@${user}> (${rank}) **— ${score} ${
          hearts[i] ?? "❤️"
        }**`;
      });
      topMaxLove = (await Promise.all(topPromises)).join("\n");
    }

    const statsPerDay = getMaxLoveStatsPerDay();
    let maxDayText = "Aucun MaxLove envoyé";
    if (Object.keys(statsPerDay).length > 0) {
      const maxEntry = Object.entries(statsPerDay).reduce((a, b) =>
        b[1] > a[1] ? b : a
      );
      const day = DateTime.fromISO(maxEntry[0])
        .setLocale("fr")
        .toLocaleString(DateTime.DATE_FULL);
      maxDayText = `${day} (${maxEntry[1]} MaxLoves)`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff66cc)
      .setTitle("📊 MaxStats")
      .setDescription(
        `**📅 Nombre de jours depuis le départ :** ${diffDays}\n\n` +
          `**📏 Kilomètres parcourus :** ${totalDistance}km\n\n` +
          `**🎯 Nombre d'étapes :** ${totalSteps}\n\n` +
          `**🌍 Nombre de pays visités :** ${totalCountries}\n${allFlags}\n\n` +
          `**💗 Total de MaxLove envoyés :** ${totalMaxLove}\n\n` +
          `**📈 Jour avec le plus de MaxLove :** ${maxDayText}\n\n` +
          `**🏆 Top 5 MaxLove :**\n${topMaxLove}`
      )
      .setFooter({ text: "MaxTripBot • Stats" });

    if (interaction) await interaction.editReply({ embeds: [embed] });
    else if (message) await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Erreur lors de la récupération des MaxStats :", error);
    const errorText = "❌ Impossible de récupérer les statistiques.";

    if (interaction) {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorText);
      } else {
        await interaction.reply(errorText);
      }
    } else if (message) {
      await message.reply(errorText);
    }
  }
}
