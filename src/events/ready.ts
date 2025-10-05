import type { Client } from "discord.js";
import cron from "node-cron";
import { dailyMaximeMessage } from "../utils/dailyMessage";

export function registerEvents(client: Client) {
  client.once("clientReady", () => {
    console.log(`✅ Connecté en tant que ${client.user?.tag}`);

    // 🕗 Planifier le message quotidien à 8h (heure de Sydney)
    client.once("clientReady", () => {
      // Affiche l'heure actuelle à Sydney pour vérification
      console.log(
        "🕒 Heure actuelle à Sydney :",
        new Date().toLocaleString("fr-FR", { timeZone: "Australia/Sydney" })
      );

      // 🎯 CRON principal : 8h à Sydney
      cron.schedule(
        "0 8 * * *",
        () => {
          console.log("🕗 [CRON] Exécution du message quotidien !");
          dailyMaximeMessage(client);
        },
        {
          timezone: "Australia/Sydney",
        }
      );

      console.log("⏰ Message quotidien planifié à 8h (heure de Sydney)");
    });
  });
}
