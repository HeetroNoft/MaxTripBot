import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getMaxLoveCount, getRank } from "../../utils/maxLoveManager";

export const data = new SlashCommandBuilder()
  .setName("maxrank")
  .setDescription("Affiche la liste des rangs ou le rang d’un utilisateur")
  .addUserOption((o) => o.setName("user").setDescription("Utilisateur à inspecter"));

export const aliases = ["maxrank"];

export async function execute({ interaction, message }: { interaction?: any; message?: any }) {
  const user = interaction?.options?.getUser("user") ?? message?.mentions?.users?.first();
  const target = user ?? interaction?.user ?? message?.author;

  if (user) return showUserRank(target, interaction, message);
  return showRankList(interaction, message);
}

async function showUserRank(user: any, interaction?: any, message?: any) {
  const maxLove = Number(getMaxLoveCount(user.id)) || 0;

  const rank = await getRank({ maxLove, dataReturn: "rank" });
  const color = await getRank({ maxLove, dataReturn: "color" });

  // Trouve le prochain rang (plus simple à calculer via la même fonction)
  const nextRankData = await getRank({ maxLove, dataReturn: "nextRank" });
  const nextRank = nextRankData ? `${nextRankData.emoji} ${nextRankData.name}` : null;
  const nextMinLove = nextRankData ? nextRankData.minLove : null;

  const missing = nextMinLove && nextMinLove > maxLove ? nextMinLove - maxLove : 0;

  const now = new Date().toLocaleString("fr-FR");
  console.log(`📦 [${now}] (/maxrank @${user.id}) Données traitées :`, {
    userId: user.id,
    maxLove,
    rank,
    nextRank,
    missing,
  });

  const desc =
    missing > 0
      ? `**${rank}** – ${maxLove} MaxLove\n\n➡️ Encore **${missing}** MaxLove pour atteindre le rang **${nextRank}**`
      : `**${rank}** – ${maxLove} MaxLove\n\n🌟 Rang **Légende** atteint !`;

  const embed = new EmbedBuilder()
    .setTitle(`🏅 Rang de ${user.username}`)
    .setColor(color)
    .setDescription(desc)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: "MaxTripBot • Progression personnelle" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else await message.reply({ embeds: [embed] });
}

async function showRankList(interaction?: any, message?: any) {
  // Récupère dynamiquement les rangs depuis getRank
  const ranksList = await getRank({ dataReturn: "ranks" });
  for (const rank of ranksList) {
    rank.line = `${rank.emoji} **${rank.name}** – ${rank.minLove} MaxLove`;
  }

  const descParts = ranksList.map((r: any) => r.line);

  const embed = new EmbedBuilder()
    .setTitle("🏅 Rangs MaxLove")
    .setColor(0xff69b4)
    .setDescription(descParts.join("\n"))
    .setFooter({ text: "MaxTripBot • Rangs et progression" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else await message.reply({ embeds: [embed] });
}
