import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getDataPayload } from "../../utils/dataPayload";
import { getMaxLoveCount } from "../../utils/maxLoveManager";

// 🔹 Définition des rangs et paliers
const RANKS: { minLove: number; name: string; emoji: string }[] = [
  { minLove: 0, name: "Novice", emoji: "🌱" },
  { minLove: 50, name: "Cuivre", emoji: "🟠" },
  { minLove: 100, name: "Bronze", emoji: "🥉" },
  { minLove: 250, name: "Silver", emoji: "🥈" },
  { minLove: 500, name: "Gold", emoji: "🥇" },
  { minLove: 800, name: "Platine", emoji: "🔷" },
  { minLove: 1200, name: "Émeraude", emoji: "💚" },
  { minLove: 2000, name: "Diamant", emoji: "💎" },
  { minLove: 3000, name: "Légende", emoji: "🌟" },
];

export const data = new SlashCommandBuilder()
  .setName("maxrank")
  .setDescription(
    "Affiche la liste des rangs ou le rang d’un utilisateur spécifique"
  )
  .addUserOption((option) =>
    option.setName("user").setDescription("Utilisateur à inspecter")
  );

export const aliases = ["maxrank"];

export async function execute({
  interaction,
  message,
}: {
  interaction?: any;
  message?: any;
}) {
  const userOption =
    interaction?.options?.getUser("user") || message?.mentions?.users?.first();
  const targetUser = userOption || interaction?.user || message?.author;

  // Si un utilisateur est précisé → afficher son rang individuel
  if (userOption) {
    // ✅ Récupère le nombre de MaxLove du user (et force le typage en nombre)
    const loveData = getMaxLoveCount(userOption.id);
    const maxLove = typeof loveData === "number" ? loveData : 0;

    // ✅ Trouver le rang actuel
    const currentRank =
      [...RANKS].reverse().find((r) => maxLove >= r.minLove) || RANKS[0];

    // ✅ Trouver le prochain rang
    const nextRankIndex = RANKS.findIndex((r) => r.minLove > maxLove);
    const nextRank = nextRankIndex === -1 ? null : RANKS[nextRankIndex];

    const missing =
      nextRank?.minLove && nextRank.minLove > maxLove
        ? nextRank.minLove - maxLove
        : 0;

    const embed = new EmbedBuilder()
      .setTitle(`🏅 Rang de ${targetUser.username}`)
      .setColor(0xff69b4)
      .setDescription(
        nextRank
          ? `${currentRank.emoji} **${currentRank.name}**\n${maxLove} MaxLove\n➡️ Encore **${missing}** MaxLove pour atteindre ${nextRank.emoji} **${nextRank.name}**`
          : `${currentRank.emoji} **${currentRank.name}**\n${maxLove} MaxLove\n🌟 Tu as atteint le rang **Légende**, félicitations !`
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setFooter({ text: "MaxTripBot • Progression personnelle" });

    if (interaction) await interaction.reply({ embeds: [embed] });
    else if (message) await message.reply({ embeds: [embed] });
    return;
  }

  // Sinon → afficher la liste complète des rangs
  const embed = new EmbedBuilder()
    .setTitle("🏅 Rangs MaxLove")
    .setColor(0xff69b4)
    .setDescription(
      RANKS.map(
        (rank) => `${rank.emoji} **${rank.name}** → ${rank.minLove} MaxLove`
      ).join("\n")
    )
    .setFooter({ text: "MaxTripBot • Rangs et progression" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
