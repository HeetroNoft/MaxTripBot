import { SlashCommandBuilder } from "discord.js";
import path from "path";

export const data = new SlashCommandBuilder()
  .setName("maxdance")
  .setDescription("Petite dance de Maxime");

export const aliases = ["maxdance"];

export async function execute({
  interaction,
  message,
}: {
  interaction?: any;
  message?: any;
}) {
  // Chemin absolu depuis la racine du projet
  const gifPath = path.join(process.cwd(), "src/assets/gif/maxdance.gif");

  try {
    if (interaction) {
      if (!interaction.replied) {
        await interaction.reply({ files: [gifPath] });
      } else {
        await interaction.followUp({ files: [gifPath] });
      }
    } else if (message) {
      await message.reply({ files: [gifPath] });
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi du GIF :", error);
  }
}
