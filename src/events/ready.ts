import type { Client } from "discord.js";
import cron from "node-cron";
import { dailyMaximeMessage } from "../utils/dailyMessage";
import { getDataPayload } from "../utils/dataPayload";
import { newStepMessage } from "../utils/newStepMessage";
import { newMediaMessage } from "../utils/newMediaMessage";

export function registerEvents(client: Client) {
  client.once("clientReady", () => {
    console.log(
      `✅ Connecté en tant que ${client.user?.tag}\n------------------------`
    );

    setDailyMaximeMessage(client);
    checkNewStepInPayload(client);
    checkNewMediaInStep(client);
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
  const latestStepId = await getDataPayload<any>("id", true, false);
  const latestStepCountry = await getDataPayload<any>(
    "location.country",
    true,
    false
  );
  const latestStepLocality = await getDataPayload<any>(
    "location.locality",
    true,
    false
  );
  console.log(
    "🚀 Step actuelle :",
    latestStepId,
    `${latestStepCountry}, ${latestStepLocality}`
  );
  cron.schedule("*/10 * * * *", async () => {
    const now = new Date().toLocaleString("fr-FR");
    console.log(`🕗 [${now}] [CRON] Exécution de la mise à jour du payload...`);
    const latestStepId = await getDataPayload<any>("id", true, false);
    const newLatestStepId = await getDataPayload<any>("id", true);
    if (latestStepId && newLatestStepId && latestStepId === newLatestStepId) {
      return undefined;
    } else {
      console.log("🚀 Nouvelle step détectée !");
      newStepMessage(client);
      return undefined;
    }
  });
  console.log(
    "⏰ Vérification des nouvelles étapes planifiée toutes les 10 minutes"
  );
}

async function checkNewMediaInStep(client: Client) {
  const latestStep = await getDataPayload<any>("id", true, false);
  const mediaArray = (await getDataPayload<any>("media", true, false)) || [];
  const latestMedia =
    mediaArray.length > 0 ? mediaArray[mediaArray.length - 1] : null;
  console.log(
    "🖼️ Media actuelle :",
    latestStep,
    latestMedia?.id,
    latestMedia?.path
  );

  cron.schedule("*/10 * * * *", async () => {
    const now = new Date().toLocaleString("fr-FR");
    console.log(
      `🕗 [${now}] [CRON] Exécution de la mise à jour de la dernière image`
    );
    const mediaArray = (await getDataPayload<any>("media", true, false)) || [];
    const latestMedia =
      mediaArray.length > 0 ? mediaArray[mediaArray.length - 1] : null;

    const newMediaArray =
      (await getDataPayload<any>("media", true, false)) || [];
    const newLatestMedia =
      newMediaArray.length > 0 ? newMediaArray[newMediaArray.length - 1] : null;

    if (latestMedia && newLatestMedia && latestMedia.id === newLatestMedia.id) {
      return undefined;
    }
    console.log("🖼️ Nouvelle image détectée !");
    newMediaMessage(client);
    return undefined;
  });
  console.log(
    "⏰ Vérification des nouvelles images planifiée toutes les 10 minutes"
  );
}
