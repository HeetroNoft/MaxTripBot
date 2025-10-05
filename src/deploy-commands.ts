import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

(async () => {
  const commandsPath = path.join(__dirname, "./commands/slash");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js")); // TypeScript ou JS compilé

  const commands = [];

  for (const file of commandFiles) {
    const commandModule = await import(path.join(commandsPath, file));
    if (commandModule.data) {
      commands.push(commandModule.data.toJSON()); // important pour Discord
    }
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log("🚀 Déploiement des commandes slash globales...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!), // <-- global
      { body: commands }
    );
    console.log("✅ Commandes slash globales déployées !");
  } catch (error) {
    console.error(error);
  }
})();
