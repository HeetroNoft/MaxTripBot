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
  // Résolution du chemin absolu
  const gifPath = path.join(__dirname, "../../../src/assets/gif/maxdance.gif");

  try {
    if (interaction) {
      // S'assurer que l'on répond une seule fois
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

/* import { SlashCommandBuilder } from "discord.js";
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
 */
