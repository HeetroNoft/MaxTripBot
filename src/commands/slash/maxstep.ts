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

  const place =
    `${await getDataPayload("location.locality", true)}, ${await getDataPayload(
      "location.country",
      true
    )}` || "Lieu inconnu";
  const dateISO =
    (await getDataPayload<string>("start_time", true)) ||
    (await getDataPayload<string>("creation_time", true)) ||
    (await getDataPayload<string>("time", true)) ||
    "Date inconnue";
  const dt = DateTime.fromISO(dateISO, { zone: "Europe/Paris" });
  const timeSinceUpdate =
    (await getDataPayload<string>("timeSinceUpdate")) || "quelques temps";

  const title =
    (await getDataPayload<string>("display_name", true)) ||
    `Halte à ${await getDataPayload<string>("location.locality", true)}` ||
    "Dernière position de Maxime";
  const temperature =
    (await getDataPayload<string>("weather_temperature", true)) || null;
  const description =
    (await getDataPayload<string>("description", true)) || null;

  // Récupère le dernier media si disponible
  const mediaArray = (await getDataPayload<any>("media", true)) || [];
  const lastMedia =
    mediaArray.length > 0 ? mediaArray[mediaArray.length - 1] : null;
  const image =
    lastMedia?.path ||
    lastMedia?.large_thumbnail_path ||
    lastMedia?.small_thumbnail_path ||
    (await getDataPayload<string>("screenshot_url", true)) ||
    null;

  const embed = new EmbedBuilder()
    .setColor(0x00aaff)
    .setTitle(title)
    .setDescription(
      `${description ? description : ""}\n\n📍 **${place}**\n🗓️ ${dt.toFormat(
        "dd LLLL yyyy 'à' HH:mm:ss"
      )}\n${temperature ? `🌡️ ${temperature}°C` : ""}`
    )
    .setFooter({
      text: `Données Polarsteps • Dernière mise à jour il y a ${timeSinceUpdate}`,
    });

  if (image) embed.setImage(image);

  await interaction.editReply({ embeds: [embed] });
}
