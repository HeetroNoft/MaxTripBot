import { EmbedBuilder } from "discord.js";
import {
  addMaxLove,
  getMaxLoveCount,
  canUseMaxLove,
  getCooldownRemaining,
} from "../../utils/maxLoveManager";

export const data = {
  name: "maxlove",
  description: "Un peu d'amour pour Maxime ! (⏱ 1h)",
};
export const aliases = ["maxlove"];

export async function execute({
  interaction,
  message,
  client,
}: {
  interaction?: any;
  message?: any;
  client: any;
}) {
  const userId = interaction?.user?.id || message?.author?.id;
  if (!userId) return;

  // Vérifier cooldown
  if (!canUseMaxLove(userId)) {
    const remainingMs = getCooldownRemaining(userId);
    const minutes = Math.ceil(remainingMs / 60000);
    const embed = new EmbedBuilder()
      .setColor(0xff4500)
      .setTitle("⏱ MaxLove Cooldown")
      .setDescription(
        `Hey **<@${userId}>** ! Tu dois attendre encore **${minutes} minute(s)** avant de pouvoir envoyer un MaxLove.`
      )
      .setFooter({ text: "MaxTripBot • Patience !" });

    if (interaction)
      return interaction.reply({ embeds: [embed], ephemeral: true });
    else return message?.reply({ embeds: [embed] });
  }

  // Incrémenter le compteur et mettre à jour le timestamp
  addMaxLove(userId);
  const personalCount = getMaxLoveCount(userId);

  const embed = new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle("💖 MaxLove !")
    .setDescription(
      `Un peu d’amour pour <@328795495936032768> !\n\nTu as maintenant envoyé **${personalCount}** MaxLove.`
    )
    .setFooter({ text: "MaxTripBot • Love pour Maxime" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
