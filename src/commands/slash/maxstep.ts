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

  const [
    locality,
    country,
    start_time,
    creation_time,
    timeSinceUpdate,
    display_name,
    temperature,
    description,
    mediaArray,
    screenshot_url,
  ] = await Promise.all([
    getDataPayload<string>("location.locality", true, false),
    getDataPayload<string>("location.country", true, false),
    getDataPayload<string>("start_time", true, false),
    getDataPayload<string>("creation_time", true, false),
    getDataPayload<string>("timeSinceUpdate", false, false),
    getDataPayload<string>("display_name", true, false),
    getDataPayload<string>("weather_temperature", true, false),
    getDataPayload<string>("description", true, false),
    getDataPayload<any[]>("media", true, false),
    getDataPayload<string>("screenshot_url", true, false),
  ]);

  const now = new Date().toLocaleString("fr-FR");
  console.log(`📦 [${now}] Données récupérées :`, {
    locality,
    country,
    start_time,
    creation_time,
    timeSinceUpdate,
    display_name,
    temperature,
    description,
    mediaCount: mediaArray?.length ?? 0,
  });

  const place =
    locality && country ? `${locality}, ${country}` : "Lieu inconnu";
  const dateISO = start_time || creation_time || "Date inconnue";
  const dt = DateTime.fromISO(dateISO, { zone: "Europe/Paris" });
  const lastMedia =
    Array.isArray(mediaArray) && mediaArray.length > 0
      ? mediaArray[mediaArray.length - 1]
      : null;

  let image =
    lastMedia?.path ||
    lastMedia?.large_thumbnail_path ||
    lastMedia?.small_thumbnail_path ||
    screenshot_url ||
    null;

  if (
    image &&
    typeof image === "string" &&
    !image.toLowerCase().endsWith(".jpg")
  ) {
    image =
      lastMedia?.large_thumbnail_path ||
      lastMedia?.small_thumbnail_path ||
      screenshot_url ||
      null;
  }

  const title =
    display_name ||
    (locality ? `Halte à ${locality}` : "Dernière position de Maxime");

  const embed = new EmbedBuilder()
    .setColor(0x00aaff)
    .setTitle(title)
    .setDescription(
      `${description ? `${description}\n\n` : ""}📍 **${place}**\n🗓️ ${
        dt.isValid ? dt.toFormat("dd LLLL yyyy 'à' HH:mm:ss") : "Date inconnue"
      }\n${temperature ? `🌡️ ${temperature}°C` : ""}`
    )
    .setFooter({
      text: `Données Polarsteps • Dernière mise à jour il y a ${
        timeSinceUpdate || "quelques temps"
      }`,
    });

  if (image) embed.setImage(image);

  await interaction.editReply({ embeds: [embed] });
}
