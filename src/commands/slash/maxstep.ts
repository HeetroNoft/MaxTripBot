import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { DateTime } from "luxon";
import { getDataPayload } from "../../utils/dataPayload";

export const data = new SlashCommandBuilder()
  .setName("maxstep")
  .setDescription(
    "Affiche la dernière position connue de Maxime sur Polarsteps"
  );

export const aliases = ["maxloc", "maxmap"];

export async function execute({ interaction }: any) {
  await interaction.deferReply();

  // Récupère la dernière step
  const latestStep = await getDataPayload<any>("", true);

  const place = latestStep?.location?.full_detail || "Lieu inconnu";
  const dateISO =
    latestStep?.start_time || latestStep?.creation_time || "Date inconnue";
  const dt = DateTime.fromISO(dateISO, { zone: "Europe/Paris" });

  const title = latestStep?.display_name || "Dernière position de Maxime";
  const temperature = latestStep?.weather_temperature ?? "Température inconnue";
  const description =
    latestStep?.description || "Pas de description disponible.";

  // Récupère le dernier media si disponible
  const mediaArray = latestStep?.media || [];
  const lastMedia =
    mediaArray.length > 0 ? mediaArray[mediaArray.length - 1].path : null;
  const image = lastMedia || latestStep?.screenshot_url || null;

  const embed = new EmbedBuilder()
    .setColor(0x00aaff)
    .setTitle(title)
    .setDescription(
      `${description}\n📍 **${place}**\n🗓️ ${dt.toFormat(
        "dd LLLL yyyy 'à' HH:mm:ss"
      )}\n🌡️ ${
        temperature !== "Température inconnue"
          ? `${temperature}°C`
          : temperature
      }`
    )
    .setFooter({ text: "MaxTripBot • Données Polarsteps" });

  if (image) embed.setImage(image);

  await interaction.editReply({ embeds: [embed] });
}
