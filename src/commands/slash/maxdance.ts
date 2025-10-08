import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("maxdance")
  .setDescription("Petite dance de maxime");

export const aliases = ["maxdance"];

export async function execute({
  interaction,
  message,
  client,
}: {
  interaction?: any;
  message?: any;
  client: any;
}) {
  const gifURL = "../../assets/gif/maxdance.gif"; // ton GIF

  if (interaction) {
    await interaction.reply({ files: [gifURL] });
  } else if (message) {
    await message.reply({ files: [gifURL] });
  }
}
