import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

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
    "https://screenshots.prod.polarsteps.dev/?url=https%3A%2F%2Fwww.polarsteps.com%2Fshare_social%2Ftrip%2F22019906%3Fs%3D8b079af3-2be6-476e-9ba8-a83448df30c9&width=1080&height=1080&token=6cedf2961f17ae4ff52382ce28a49e62&success_var=screenshotIsReady&failure_var=screenshotWontBeReady&last_mod=1759496927";
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
