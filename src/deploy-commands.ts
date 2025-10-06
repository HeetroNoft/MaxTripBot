import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env" });

(async () => {
  try {
    // 🔹 Chemin vers le dossier des commandes slash
    const commandsPath = path.join(__dirname, "./commands/slash");
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

    const commands = [];

    for (const file of commandFiles) {
      const commandModule = await import(path.join(commandsPath, file));
      const command = commandModule.data ?? commandModule.default?.data;
      if (!command) continue;

      if (typeof command.toJSON === "function") {
        commands.push(command.toJSON());
      } else {
        commands.push(command);
      }
    }

    // 🔹 Initialisation du client REST avec ton token
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN!
    );

    // Liste des serveurs où déployer
    const guildIds = process.env.GUILD_IDS?.split(",") || [];
    if (guildIds.length === 0) {
      console.log(
        "⚠️ Aucune GUILD_ID fournie dans .env (GUILD_IDS séparées par des virgules)"
      );
      return;
    }

    console.log("🚀 Déploiement des commandes slash sur les serveurs...");

    // 🔹 Déploiement sur chaque serveur
    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId.trim()),
        { body: commands }
      );
      console.log(`✅ Commandes slash déployées sur le serveur ${guildId}`);
    }

    console.log("🎉 Déploiement terminé sur tous les serveurs !");
  } catch (error) {
    console.error("❌ Erreur lors du déploiement des commandes :", error);
  }
})();
