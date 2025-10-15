import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { DateTime } from "luxon";
import { getDataPayload } from "../../utils/dataPayload";

export const data = new SlashCommandBuilder()
  .setName("maxstep")
  .setDescription(
    "Affiche la dernière position connue de Maxime sur Polarsteps (ou via Zelda si plus récent)"
  );

export const aliases = ["maxloc", "maxmap"];

export async function execute({ interaction }: any) {
  await interaction.deferReply();

  // --- Récupère les données principales
  const lastStepTime =
    (await getDataPayload<string>("start_time", true)) ||
    (await getDataPayload<string>("creation_time", true));
  const zeldaSteps = (await getDataPayload<any>("zelda_steps")) || [];

  let useZelda = false;
  let place: string = "Lieu inconnu";
  let dateISO: string = "Date inconnue";

  // --- Vérifie si un zelda_step plus récent existe
  if (zeldaSteps.length > 0) {
    const latestZelda = zeldaSteps
      .map((z: any) => ({
        ...z,
        dt: DateTime.fromISO(z.time),
      }))
      .sort((a: any, b: any) => b.dt.toMillis() - a.dt.toMillis())[0];

    if (lastStepTime) {
      const lastStepDt = DateTime.fromISO(lastStepTime);
      if (latestZelda.dt > lastStepDt) {
        useZelda = true;
        place =
          latestZelda.location?.locality ||
          latestZelda.location?.country ||
          "Lieu inconnu";
        dateISO = latestZelda.time;
      }
    } else {
      useZelda = true;
      place =
        latestZelda.location?.locality ||
        latestZelda.location?.country ||
        "Lieu inconnu";
      dateISO = latestZelda.time;
    }
  }

  // --- Si pas de Zelda plus récent, utiliser les données Polarsteps normales
  if (!useZelda) {
    place =
      (await getDataPayload<string>("location.full_detail", true)) ||
      "Lieu inconnu";
    dateISO = lastStepTime || "Date inconnue";
  }

  const dt = DateTime.fromISO(dateISO, { zone: "Europe/Paris" });
  const timeSinceUpdate =
    (await getDataPayload<string>("timeSinceUpdate")) || "quelques temps";

  const title =
    (await getDataPayload<string>("display_name", true)) ||
    (useZelda ? "Dernière position (Zelda)" : "Dernière position de Maxime");

  const temperature =
    (await getDataPayload<string>("weather_temperature", true)) ||
    "Température inconnue";
  const description =
    (await getDataPayload<string>("description", true)) ||
    "Pas de description disponible.";

  // --- Image si Polarsteps utilisé
  let image: string | null = null;
  if (!useZelda) {
    const mediaArray = (await getDataPayload<any>("media", true)) || [];
    const lastMedia =
      mediaArray.length > 0 ? mediaArray[mediaArray.length - 1] : null;
    image =
      lastMedia?.path ||
      lastMedia?.large_thumbnail_path ||
      lastMedia?.small_thumbnail_path ||
      (await getDataPayload<string>("screenshot_url", true)) ||
      null;
  }

  // --- Construction de l’embed
  const embed = new EmbedBuilder()
    .setColor(useZelda ? 0xffaa00 : 0x00aaff)
    .setTitle(title)
    .setDescription(
      `${description}\n\n📍 **${place}**\n🗓️ ${
        dt.isValid ? dt.toFormat("dd LLLL yyyy 'à' HH:mm:ss") : "Date inconnue"
      }\n${
        !useZelda
          ? `🌡️ ${
              temperature !== "Température inconnue"
                ? `${temperature}°C`
                : temperature
            }`
          : ""
      }`
    )
    .setFooter({
      text: `Source: ${
        useZelda ? "Zelda" : "Polarsteps"
      } • Dernière mise à jour il y a ${timeSinceUpdate}`,
    });

  if (image) embed.setImage(image);

  await interaction.editReply({ embeds: [embed] });
}
