import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import {
  addMaxLove,
  getMaxLoveCount,
  canUseMaxLove,
  getCooldownRemaining,
  getRank,
  getMaxLoveToday,
} from "../../utils/maxLoveManager";
import { ThemeColors } from "../../utils/theme";

export const data = new SlashCommandBuilder()
  .setName("maxlove")
  .setDescription("Un peu d'amour pour Maxime ! (⏱ 1h)");
export const aliases = ["maxlove"];

export async function execute({ interaction, message }: { interaction?: any; message?: any }) {
  const userId = interaction?.user?.id || message?.author?.id;
  if (!userId) return;

  const MaxUserId = "328795495936032768";
  if (userId === MaxUserId) {
    return (
      interaction?.reply?.({
        content: "Ah ouai tu t'aimes toi même hein ?! 😤",
      }) || message?.reply?.("Ah ouai tu t'aimes toi même hein ?! 😤")
    );
  }

  const departISO = process.env.MAX_DEPART;
  if (!departISO) {
    console.error("❌ MAX_DEPART manquant dans .env");
    return;
  }

  const today = DateTime.now().startOf("day");
  const departDate = DateTime.fromISO(departISO).startOf("day");
  const diffDays = today.diff(departDate, "days").days;

  if (diffDays < 0) {
    const embed = new EmbedBuilder()
      .setColor(ThemeColors.Error)
      .setTitle("⏳ MaxLove indisponible")
      .setDescription(
        `Hey **<@${userId}>** ! Maxime n’est pas encore parti 🇦🇺\n` +
          `Tu pourras envoyer ton premier MaxLove dans **${Math.ceil(
            Math.abs(diffDays)
          )} jour(s)**.`
      )
      .setFooter({ text: "MaxTripBot • Patience !" });

    return (
      interaction?.reply?.({ embeds: [embed], flags: 64 }) || message?.reply?.({ embeds: [embed] })
    );
  }

  if (!canUseMaxLove(userId)) {
    const minutes = Math.ceil(getCooldownRemaining(userId) / 60000);
    const embed = new EmbedBuilder()
      .setColor(ThemeColors.Warning)
      .setTitle("⏱ MaxLove Cooldown")
      .setDescription(
        `Hey **<@${userId}>** ! Attends encore **${minutes} minute(s)** avant de pouvoir envoyer un MaxLove.`
      )
      .setFooter({ text: "MaxTripBot • Patience !" });

    return (
      interaction?.reply?.({ embeds: [embed], flags: 64 }) || message?.reply?.({ embeds: [embed] })
    );
  }

  addMaxLove(userId);
  const personalCount = getMaxLoveCount(userId);
  const personalCountToday = getMaxLoveToday(userId);
  const rank = await getRank({ maxLove: personalCount, dataReturn: "rank" });

  const embed = new EmbedBuilder()
    .setColor(ThemeColors.MaxLove)
    .setTitle("💖 MaxLove !")
    .setDescription(
      `Un peu d’amour pour <@${MaxUserId}> !\n\n` +
        `**<@${userId}>** (${rank}) a maintenant envoyé **${personalCount}** MaxLove.\n\n` +
        `*Aujourd'hui, tu as déjà envoyé **${personalCountToday}** MaxLove.*`
    )
    .setFooter({ text: "MaxTripBot • Love pour Maxime" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else await message?.reply({ embeds: [embed] });
}
