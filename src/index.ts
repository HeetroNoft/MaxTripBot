import { Client, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
import cron from "node-cron";
import { registerEvents } from "./events/ready";
import { handleMessage } from "./events/messageCreate";
import { ExtendedClient } from "./types/ExtendedClient";
import { loadSlashCommands } from "./utils/logger";
import { dailyMaximeMessage } from "./utils/dailyMessage";

dotenv.config({ path: ".env" });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
}) as ExtendedClient;

// ✅ Initialisation des collections et prefix
client.commands = new Collection();
client.prefix = process.env.PREFIX || "!";

(async () => {
  // ⚡ Charger toutes les commandes slash avant de démarrer
  await loadSlashCommands(client);

  // 🔹 Enregistrement des événements
  registerEvents(client);
  handleMessage(client);

  // 🧭 Interaction slash
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    // ❌ Sécurité : vérifier que execute existe
    if (!command || typeof command.execute !== "function") {
      console.warn(
        `⚠️ Commande ${interaction.commandName} non trouvée ou execute manquant`
      );
      return;
    }

    try {
      await command.execute({ interaction, client });
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            "Une erreur est survenue lors de l'exécution de la commande.",
          ephemeral: true,
        });
      }
    }
  });

  // 🕗 Planifier le message quotidien à 8h heure de Sydney
  client.once("clientReady", () => {
    cron.schedule(
      "0 8 * * *",
      () => {
        dailyMaximeMessage(client);
      },
      {
        timezone: "Australia/Sydney",
      }
    );

    console.log("⏰ Message quotidien planifié à 8h (heure de Sydney)");
  });

  // 🚀 Connexion du bot
  await client.login(process.env.DISCORD_TOKEN);
})();
