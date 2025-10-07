import type { Client } from "discord.js";
import cron from "node-cron";
import { dailyMaximeMessage } from "../utils/dailyMessage";

export function registerEvents(client: Client) {
  client.once("clientReady", () => {
    console.log(`✅ Connecté en tant que ${client.user?.tag}`);

    console.log(
      "🕒 Heure actuelle à Perth :",
      new Date().toLocaleString("fr-FR", { timeZone: "Australia/Perth" })
    );

    // 🎯 CRON principal : 6h à Perth
    cron.schedule(
      "1 6 * * *",
      () => {
        console.log("🕗 [CRON] Exécution du message quotidien !");
        dailyMaximeMessage(client);
      },
      {
        timezone: "Australia/Perth",
      }
    );

    console.log("⏰ Message quotidien planifié à 6h (heure de Perth)");
  });
}
