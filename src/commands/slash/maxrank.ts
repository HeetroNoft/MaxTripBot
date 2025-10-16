import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

// 🔹 Définition des rangs et paliers
const RANKS: { name: string; emoji: string; minLove: number }[] = [
  { name: "Novice", emoji: "🥉", minLove: 0 },
  { name: "Apprenti", emoji: "🥈", minLove: 50 },
  { name: "Expert", emoji: "🥇", minLove: 200 },
  { name: "Maître", emoji: "💎", minLove: 500 },
  { name: "Légende", emoji: "🌟", minLove: 1000 },
];

export const data = new SlashCommandBuilder()
  .setName("maxrank")
  .setDescription("Affiche la liste des rangs et le nombre de Max Love requis");

export const aliases = ["maxrank"];

export async function execute({
  interaction,
  message,
}: {
  interaction?: any;
  message?: any;
}) {
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
