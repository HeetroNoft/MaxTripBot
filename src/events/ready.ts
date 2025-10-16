import type { Client } from "discord.js";
import cron from "node-cron";
import { dailyMaximeMessage } from "../utils/dailyMessage";
import { updatePayload } from "../utils/dataPayload";
import path from "path";
import fs from "fs-extra";
import { newStepMessage } from "../utils/newStepMessage";

export function registerEvents(client: Client) {
  client.once("clientReady", () => {
    console.log(`✅ Connecté en tant que ${client.user?.tag}`);

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
      console.log("🕗 [CRON] Exécution du message quotidien !");
      dailyMaximeMessage(client);
    },
    {
      timezone: "Australia/Perth",
    }
  );

  console.log("⏰ Message quotidien planifié à 6h (heure de Perth)");
}

function checkNewStepInPayload(client: Client) {
  cron.schedule("10 * * * *", async () => {
    console.log("🕗 [CRON] Exécution de la mise à jour du payload...");
    const PAYLOAD_FILE = path.resolve("./data/payload.json");
    const localPayload = await fs.readJson(PAYLOAD_FILE);
    const latestStep = (localPayload.steps || []).sort(
      (a: any, b: any) =>
        new Date(b.start_time || b.creation_time).getTime() -
        new Date(a.start_time || a.creation_time).getTime()
    )[0];
    const updatedPayload = await updatePayload();
    if (!updatedPayload) {
      console.error("❌ Échec de la mise à jour du payload.");
      return undefined;
    }
    const newPayload = await fs.readJson(updatedPayload);
    const newLatestStep = (newPayload.steps || []).sort(
      (a: any, b: any) =>
        new Date(b.start_time || b.creation_time).getTime() -
        new Date(a.start_time || a.creation_time).getTime()
    )[0];
    if (latestStep && newLatestStep && latestStep.id === newLatestStep.id) {
      return undefined;
    }
    console.log("🚀 Nouvelle step détectée !");
    newStepMessage(client);
    return undefined;
  });
}
