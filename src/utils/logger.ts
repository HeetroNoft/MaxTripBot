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
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  const commands = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(filePath);

    // Récupère data et execute correctement
    const commandData = commandModule.data ?? commandModule.default?.data;
    const commandExecute =
      commandModule.execute ?? commandModule.default?.execute;

    if (!commandData || !commandData.name) continue;

    // Stocke dans la collection : { data, execute }
    client.commands.set(commandData.name, {
      data: commandData,
      execute: commandExecute,
    });

    // Pour le déploiement, on a besoin uniquement de data
    if (typeof commandData.toJSON === "function") {
      commands.push(commandData.toJSON());
    } else {
      commands.push(commandData);
    }
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

  const guildIds =
    process.env.GUILD_IDS?.split(",").map((id) => id.trim()) || [];

  if (guildIds.length === 0) {
    console.warn(
      "⚠️ Aucune GUILD_ID fournie dans .env (GUILD_IDS séparées par des virgules)."
    );
    return;
  }

  try {
    console.log("🚀 Déploiement des commandes slash sur les serveurs...");
    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
        { body: commands }
      );
      console.log(`✅ Commandes slash déployées sur le serveur ${guildId}`);
    }
    console.log("🎉 Déploiement terminé sur tous les serveurs !");
  } catch (error) {
    console.error("❌ Erreur lors du déploiement des commandes :", error);
  }
}
