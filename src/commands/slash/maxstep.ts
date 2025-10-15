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

  const lastStepTime =
    (await getDataPayload<string>("start_time", true)) ||
    (await getDataPayload<string>("creation_time", true));
  const zeldaSteps = (await getDataPayload<any>("zelda_steps")) || [];

  let useZelda = false;
  let place: string = "Lieu inconnu";
  let dateISO: string = "Date inconnue";
  let title = "Dernière position de Maxime";
  let description =
    (await getDataPayload<string>("description", true)) ||
    "Pas de description disponible.";

  // --- Vérifie si un zelda_step plus récent existe
  let latestZelda: any = null;
  if (zeldaSteps.length > 0) {
    latestZelda = zeldaSteps
      .map((z: any) => ({ ...z, dt: DateTime.fromISO(z.time) }))
      .sort((a: any, b: any) => b.dt.toMillis() - a.dt.toMillis())[0];

    if (lastStepTime) {
      const lastStepDt = DateTime.fromISO(lastStepTime);
      if (latestZelda.dt > lastStepDt) useZelda = true;
    } else useZelda = true;
  }

  if (useZelda && latestZelda) {
    place =
      latestZelda.location?.locality ||
      latestZelda.location?.country ||
      "Lieu inconnu";
    dateISO = latestZelda.time;
    title = `Halte à ${latestZelda.location?.locality || place}`;
    description = ""; // aucune description pour Zelda
  } else {
    place =
      (await getDataPayload<string>("location.full_detail", true)) ||
      "Lieu inconnu";
    dateISO = lastStepTime || "Date inconnue";
    title =
      (await getDataPayload<string>("display_name", true)) ||
      "Dernière position de Maxime";
  }

  const dt = DateTime.fromISO(dateISO, { zone: "Europe/Paris" });
  const timeSinceUpdate =
    (await getDataPayload<string>("timeSinceUpdate")) || "quelques temps";
  const temperature =
    (await getDataPayload<string>("weather_temperature", true)) ||
    "Température inconnue";

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

  const embed = new EmbedBuilder()
    .setColor(useZelda ? 0xffaa00 : 0x00aaff)
    .setTitle(title)
    .setDescription(
      `${description ? `${description}\n\n` : ""}📍 **${place}**\n🗓️ ${
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
