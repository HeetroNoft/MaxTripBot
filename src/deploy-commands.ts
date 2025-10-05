import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

(async () => {
  const commandsPath = path.join(__dirname, "./commands/slash");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".ts"));

  const commands = [];

  for (const file of commandFiles) {
    // import dynamique
    const commandModule = await import(path.join(commandsPath, file));
    if (commandModule.data) {
      commands.push(commandModule.data);
    }
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log("🚀 Déploiement des commandes slash...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      { body: commands }
    );
    console.log("✅ Commandes slash déployées !");
  } catch (error) {
    console.error(error);
  }
})();
