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
  const TRIP_URL = process.env.TRIP_URL;

  const pictureUrl =
    (await getDataPayload<string>("cover_photo.large_thumbnail_path")) || null;
  const userId = "328795495936032768";
  const user = await client.users.fetch(userId);

  const embed = new EmbedBuilder()
    .setColor(0x4ceb34)
    .setTitle("Polarsteps de Maxime")
    .setURL(TRIP_URL as string)
    .setDescription(`Découvrez le voyage en Australie de Maxime 🇦🇺🦘🌏`)
    .setAuthor({ name: "Maxime Crosne" })
    .setThumbnail(user.displayAvatarURL({ size: 1024, dynamic: true }))
    .setImage(pictureUrl)
    .setFooter({ text: "MaxTripBot • Polarsteps" });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
