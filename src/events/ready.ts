import type { Client } from "discord.js";
import cron from "node-cron";
import { dailyMaximeMessage } from "../utils/dailyMessage";

export function registerEvents(client: Client) {
  client.once("clientReady", () => {
    console.log(`✅ Connecté en tant que ${client.user?.tag}`);

    console.log(
      "🕒 Heure actuelle à Sydney :",
      new Date().toLocaleString("fr-FR", { timeZone: "Australia/Sydney" })
    );

    // 🎯 CRON principal : 9h à Sydney
    cron.schedule(
      "18 9 * * *",
      () => {
        console.log("🕗 [CRON] Exécution du message quotidien !");
        dailyMaximeMessage(client);
      },
      {
        timezone: "Australia/Sydney",
      }
    );

    console.log("⏰ Message quotidien planifié à 9h (heure de Sydney)");
  });
}
