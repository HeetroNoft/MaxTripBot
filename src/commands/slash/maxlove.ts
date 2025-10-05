import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import {
  addMaxLove,
  getMaxLoveCount,
  canUseMaxLove,
  getCooldownRemaining,
} from "../../utils/maxLoveManager";

export const data = new SlashCommandBuilder()
  .setName("maxlove")
  .setDescription("Un peu d'amour pour Maxime ! (⏱ 1h)");

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

  // 🔹 Vérifier si on est le jour du départ ou après
  const departISO = process.env.MAX_DEPART;
  if (!departISO) {
    console.error("❌ MAX_DEPART manquant dans .env");
    return;
  }

  const today = DateTime.now().startOf("day");
  const departDate = DateTime.fromISO(departISO).startOf("day");
  const diffDays = today.diff(departDate, "days").days;

  if (diffDays < 0) {
    const remainingDays = Math.ceil(Math.abs(diffDays));
    const embed = new EmbedBuilder()
      .setColor(0xff0059)
      .setTitle("⏳ MaxLove indisponible")
      .setDescription(
        `Hey **<@${userId}>** ! Maxime n’est pas encore parti pour l’Australie 🇦🇺\n` +
          `Tu pourras envoyer ton premier MaxLove dans **${remainingDays} jour(s)**.`
      )
      .setFooter({ text: "MaxTripBot • Patience !" });

    if (interaction) return interaction.reply({ embeds: [embed], flags: 64 });
    else return message?.reply({ embeds: [embed] });
  }

  // 🔹 Vérifier cooldown
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

    if (interaction) return interaction.reply({ embeds: [embed], flags: 64 });
    else return message?.reply({ embeds: [embed] });
  }

  // 🔹 Incrémenter le compteur et mettre à jour le timestamp
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
