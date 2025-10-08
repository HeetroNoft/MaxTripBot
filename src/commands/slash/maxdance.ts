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
  const gifPath = path.join(process.cwd(), "src/assets/gif/maxdance.gif");

  try {
    if (interaction) {
      // Avertir Discord qu'on répond plus tard
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }

      // Ensuite, envoyer le GIF
      await interaction.followUp({ files: [gifPath] });
    } else if (message) {
      // Message classique
      await message.reply({ files: [gifPath] });
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi du GIF :", error);
  }
}
