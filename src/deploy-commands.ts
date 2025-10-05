import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

(async () => {
  try {
    // 🔹 Chemin vers le dossier des commandes slash
    const commandsPath = path.join(__dirname, "./commands/slash");
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

    const commands = [];

    for (const file of commandFiles) {
      // import dynamique
      const commandModule = await import(path.join(commandsPath, file));

      if (commandModule.data) {
        // Vérifie si c'est un SlashCommandBuilder et utilise toJSON
        if (typeof commandModule.data.toJSON === "function") {
          commands.push(commandModule.data.toJSON());
        } else {
          commands.push(commandModule.data);
        }
      }
    }

    // 🔹 Initialisation du client REST avec ton token
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN!
    );

    console.log("🚀 Déploiement des commandes slash globalement...");

    // 🔹 Déploiement global (à remplacer par applicationGuildCommands pour serveur spécifique)
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commands,
    });

    console.log("✅ Commandes slash déployées globalement !");
  } catch (error) {
    console.error("❌ Erreur lors du déploiement des commandes :", error);
  }
})();
