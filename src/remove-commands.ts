import { REST, Routes } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: [],
    });
    console.log("✅ Toutes les commandes globales ont été supprimées !");
  } catch (error) {
    console.error("❌ Erreur lors de la suppression :", error);
  }
})();
