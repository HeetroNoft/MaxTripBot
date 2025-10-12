import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";

// Charger le fichier JSON contenant les phrases
const hugsPath = path.join(__dirname, "../../../data/maxhug_row.json");
const hugs = JSON.parse(fs.readFileSync(hugsPath, "utf8"));

export const data = new SlashCommandBuilder()
  .setName("maxhug")
  .setDescription("Envoie un câlin virtuel à Maxime");

export const aliases = ["maxhug"];

export async function execute({ interaction }: any) {
  const random = hugs[Math.floor(Math.random() * hugs.length)];
  await interaction.reply(
    random.replace("<@user>", `<@${interaction.user.id}>`)
  );
}
