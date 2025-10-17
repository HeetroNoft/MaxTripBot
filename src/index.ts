import { Client, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
import { registerEvents } from "./events/ready";
import { handleMessage } from "./events/messageCreate";
import { ExtendedClient } from "./types/ExtendedClient";
import { loadSlashCommands } from "./utils/logger";

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

      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content:
              "Une erreur est survenue lors de l'exécution de la commande.",
          });
        } else if (!interaction.replied) {
          await interaction.reply({
            content:
              "Une erreur est survenue lors de l'exécution de la commande.",
            ephemeral: true,
          });
        } else {
          await interaction.followUp({
            content:
              "Une erreur est survenue lors de l'exécution de la commande.",
            ephemeral: true,
          });
        }
      } catch (err) {
        console.warn("Impossible d'envoyer une réponse à l'interaction :", err);
      }
    }
  });

  // 🚀 Connexion du bot
  await client.login(process.env.DISCORD_TOKEN);
})();
