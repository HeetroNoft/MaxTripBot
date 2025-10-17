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
}: {
  interaction?: any;
  message?: any;
}) {
  try {
    if (interaction) await interaction.deferReply();

    // Exécuter toutes les requêtes de données en parallèle
    const [totalDistanceRaw, totalCountries, totalSteps, allFlags] =
      await Promise.all([
        getDataPayload<number>("total_km"),
        getDataPayload<number>("nb_country"),
        getDataPayload<number>("nb_steps"),
        getDataPayload<string[]>("flag_countries"),
      ]);

    const totalDistance =
      typeof totalDistanceRaw === "number"
        ? `${totalDistanceRaw.toFixed(1)} km`
        : "Distance inconnue";

    const departISO = process.env.MAX_DEPART || "";
    const nowParis = DateTime.now().setZone("Europe/Paris").startOf("day");
    const departDate = DateTime.fromISO(departISO, {
      zone: "Europe/Paris",
    }).startOf("day");
    const diffDaysNum = Math.max(
      0,
      Math.floor(nowParis.diff(departDate, "days").days)
    );
    const diffDays = diffDaysNum === 0 ? "Aujourd'hui" : `${diffDaysNum} jours`;

    // MaxLove stats
    const totalMaxLove = getMaxLoveCount();
    const leaderboard = getMaxLoveLeaderboard();
    const statsPerDay = getMaxLoveStatsPerDay();

    // Classement MaxLove
    let topMaxLove = "Aucun MaxLove pour le moment 😢";
    if (leaderboard.length > 0) {
      const sorted = [...leaderboard].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const hearts = ["💗", "💖", "💘", "💞", "💕"];
      const entries = await Promise.all(
        sorted.map(async ([user, score], i) => {
          const rank = await getRank(score, false);
          return `**${i + 1}.** <@${user}> (${rank}) **— ${score} ${
            hearts[i] ?? "❤️"
          }**`;
        })
      );
      topMaxLove = entries.join("\n");
    }

    // Jour avec le plus de MaxLove
    let maxDayText = "Aucun MaxLove envoyé";
    const days = Object.entries(statsPerDay);
    if (days.length > 0) {
      const [bestDay, bestValue] = days.reduce((a, b) => (b[1] > a[1] ? b : a));
      const formatted = DateTime.fromISO(bestDay)
        .setLocale("fr")
        .toLocaleString(DateTime.DATE_FULL);
      maxDayText = `${formatted} (${bestValue} MaxLoves)`;
    }

    const now = new Date().toLocaleString("fr-FR");
    console.log(`📦 [${now}] (/maxstats) Données traitées :`, {
      totalDistance,
      totalCountries,
      totalSteps,
      totalMaxLove,
      maxDayText,
      leaderboardSize: leaderboard.length,
    });

    const embed = new EmbedBuilder()
      .setColor(0xff66cc)
      .setTitle("📊 MaxStats")
      .setDescription(
        [
          `**📅 Nombre de jours depuis le départ :** ${diffDays}`,
          `**📏 Kilomètres parcourus :** ${totalDistance}`,
          `**🎯 Nombre d'étapes :** ${totalSteps ?? "Inconnu"}`,
          `**🌍 Nombre de pays visités :** ${totalCountries ?? "Inconnu"} ${
            allFlags ? `\n${allFlags}` : ""
          }`,
          `**💗 Total de MaxLove envoyés :** ${totalMaxLove}`,
          `**📈 Jour avec le plus de MaxLove :** ${maxDayText}`,
          `**🏆 Top 5 MaxLove :**\n${topMaxLove}`,
        ].join("\n\n")
      )
      .setFooter({ text: "MaxTripBot • Stats" });

    if (interaction) await interaction.editReply({ embeds: [embed] });
    else if (message) await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des MaxStats :", error);
    const msg = "❌ Impossible de récupérer les statistiques.";
    if (interaction) {
      if (interaction.deferred || interaction.replied)
        await interaction.editReply(msg);
      else await interaction.reply(msg);
    } else if (message) {
      await message.reply(msg);
    }
  }
}
