import { DateTime } from "luxon";
import dotenv from "dotenv";

dotenv.config();

export const data = {
  name: "maxdate",
  description: "Affiche la date de départ de Maxime pour l’Australie",
};

export const aliases = ["maxdate", "maxstart", "maxdepart"];

export async function execute({ interaction, message }: any) {
  const departISO = process.env.MAX_DEPART;

  if (!departISO) {
    const errorText =
      "❌ La date de départ n'est pas configurée dans le fichier .env.";
    if (interaction)
      return interaction.reply({ content: errorText, ephemeral: true });
    if (message) return message.reply(errorText);
    return;
  }

  const departDate = DateTime.fromISO(departISO).setZone("Australia/Sydney");

  // Utiliser Intl.DateTimeFormat pour formater en français
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(departDate.toJSDate());

  const replyText = `🛫 Maxime est parti pour l’Australie le **${formatted}**.`;

  if (interaction) {
    await interaction.reply({ content: replyText });
  } else if (message) {
    await message.reply(replyText);
  }
}
