import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";

export const data = new SlashCommandBuilder()
  .setName("maxhelp")
  .setDescription("Affiche la liste des commandes");

export const aliases = ["maxhelp"];

export async function execute({
  interaction,
  message,
  client,
}: {
  interaction?: any;
  message?: any;
  client: any;
}) {
  const commandsDir = path.join(__dirname, "../slash"); // dossier des commandes slash
  const commandFiles = fs
    .readdirSync(commandsDir)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  const embed = new EmbedBuilder()
    .setColor(0x00ff99)
    .setTitle("📜 Liste des commandes MaxTripBot")
    .setDescription("Voici toutes les commandes disponibles :");

  for (const file of commandFiles) {
    const command = await import(path.join(commandsDir, file));
    const name = command.data?.name || "unknown";
    const options = command.data?.options;
    const description = command.data?.description || "Pas de description";
    embed.addFields({
      name: `/${name}${
        options ? ` - (${options.map((o: any) => o.name).join(", ")})` : ""
      }`,
      value: description,
      inline: false,
    });
  }

  embed.setFooter({
    text: "MaxTripBot by Heet • Les commandes pour notre Maxime",
  });

  if (interaction) await interaction.reply({ embeds: [embed] });
  else if (message) await message.reply({ embeds: [embed] });
}
