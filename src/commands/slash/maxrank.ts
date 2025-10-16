import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

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
