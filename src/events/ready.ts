import type { Client } from "discord.js";
import cron from "node-cron";
import { dailyMaximeMessage } from "../utils/dailyMessage";
import { getDataPayload } from "../utils/dataPayload";
import { newPayloadMessage } from "../utils/newPayloadMessage";

export function registerEvents(client: Client) {
  client.once("clientReady", () => {
    console.log(
      `✅ Connecté en tant que ${client.user?.tag}\n------------------------`
    );

    setDailyMaximeMessage(client);
    checkNewStepInPayload(client);
  });
}

function setDailyMaximeMessage(client: Client) {
  console.log(
    "🕒 Heure actuelle à Perth :",
    new Date().toLocaleString("fr-FR", { timeZone: "Australia/Perth" })
  );

  // 🎯 CRON principal : 6h à Perth
  cron.schedule(
    "1 6 * * *",
    () => {
      const now = new Date().toLocaleString("fr-FR");
      console.log(`🕗 [${now}] [CRON] Exécution du message quotidien !`);
      dailyMaximeMessage(client);
    },
    {
      timezone: "Australia/Perth",
    }
  );

  console.log("⏰ Message quotidien planifié à 6h (heure de Perth)");
}

async function checkNewStepInPayload(client: Client) {
  cron.schedule("*/10 * * * *", async () => {
    const now = new Date().toLocaleString("fr-FR");
    console.log(`🕗 [${now}] [CRON] Exécution de la mise à jour du payload...`);

    // 🔍 Vérifier les nouvelles étapes ou médias
    const latestStepId = await getDataPayload<any>("id", true, false);
    const mediaArray = (await getDataPayload<any>("media", true, false)) || [];
    const latestMedia =
      mediaArray.length > 0 ? mediaArray[mediaArray.length - 1] : null;

    const newLatestStepId = await getDataPayload<any>("id", true);
    const newMediaArray = (await getDataPayload<any>("media", true)) || [];
    const newLatestMedia =
      newMediaArray.length > 0 ? newMediaArray[newMediaArray.length - 1] : null;

    // Pas de nouvelle étape
    if (!latestStepId || !newLatestStepId) {
      console.error("⚠️ Impossible de récupérer les étapes.");
      return undefined;
    }

    // Même étape, vérifier les médias
    if (latestStepId && newLatestStepId && latestStepId === newLatestStepId) {
      // Même média, rien à faire
      if (
        latestMedia &&
        newLatestMedia &&
        latestMedia.id === newLatestMedia.id
      ) {
        return undefined;
      } else {
        console.log("🖼️ Nouvelle image détectée !");
        newPayloadMessage(client, true);
      }
    } else {
      console.log("🚀 Nouvelle step détectée !");
      newPayloadMessage(client);
      return undefined;
    }
  });
  console.log(
    "⏰ Vérification des nouvelles étapes planifiée toutes les 10 minutes"
  );
}
