import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getDataPayload } from "../../utils/dataPayload";

export const data = new SlashCommandBuilder()
  .setName("maxpolar")
  .setDescription("Affiche le lien vers le Polarsteps de Maxime");

export const aliases = ["maxpolar"];

export async function execute({
  interaction,
  message,
  client,
}: {
  interaction?: any;
  message?: any;
  client: any;
}) {
  const polarLink =
    "https://www.polarsteps.com/MaximeCrosne/22019906-australie?s=8b079af3-2be6-476e-9ba8-a83448df30c9&referral=true";
  const pictureUrl =
    (await getDataPayload<string>("cover_photo.large_thumbnail_path")) || null;
  const userId = "328795495936032768";
  const user = await client.users.fetch(userId);

  const embed = new EmbedBuilder()
    .setColor(0x4ceb34)
    .setTitle("Polarsteps de Maxime")
    .setURL(polarLink)
    .setDescription(`Découvrez le voyage en Australie de Maxime 🇦🇺🦘🌏`)
    .setAuthor({ name: "Maxime Crosne" })
    .setThumbnail(user.displayAvatarURL({ size: 1024, dynamic: true }))
    .setImage(pictureUrl)
    .setFooter({ text: "MaxTripBot • Polarsteps" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
