import fs from "fs";
import path from "path";
import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import type { ExtendedClient } from "../types/ExtendedClient";

dotenv.config();

export async function loadSlashCommands(client: ExtendedClient) {
  const commandsPath = path.join(__dirname, "../commands/slash");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".ts"));

  const commands = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);

    if (!command.data || !command.data.name) continue; // sécurité
    client.commands.set(command.data.name, command);
    commands.push(command.data); // on push l'objet "data" directement
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log("🚀 Déploiement des commandes slash...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_IDS!
      ),
      { body: commands } // plus besoin de .toJSON()
    );
    console.log("✅ Commandes slash déployées !");
  } catch (error) {
    console.error(error);
  }
}
