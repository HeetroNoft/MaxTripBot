import { dailyMaximeMessage } from "../../utils/dailyMessage";

export const data = {
  name: "maxtestdaily",
  description: "Envoie un message de test du daily MaxTripBot",
};

export const aliases = ["maxtestdaily"];

export async function execute({ interaction, message, client }: any) {
  try {
    await dailyMaximeMessage(client);

    const replyText = "✅ Message quotidien de test envoyé !";
    if (interaction) {
      await interaction.reply({ content: replyText, ephemeral: true });
    } else if (message) {
      await message.reply(replyText);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test du daily message :", error);
    const errorText = "❌ Impossible d'envoyer le message de test.";
    if (interaction) {
      await interaction.reply({ content: errorText, ephemeral: true });
    } else if (message) {
      await message.reply(errorText);
    }
  }
}
