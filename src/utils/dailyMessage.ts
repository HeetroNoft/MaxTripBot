import { TextChannel, Client } from "discord.js";
import { DateTime } from "luxon";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { getMaxLoveCount } from "./maxLoveManager";

dotenv.config();

/**
 * Envoie un message quotidien indiquant le nombre de jours depuis le départ de Maxime.
 * Une phrase aléatoire est sélectionnée à partir du fichier JSON.
 */
export async function dailyMaximeMessage(client: Client) {
  const total = getMaxLoveCount();
  const channelId = process.env.DAILY_CHANNEL_ID; // process.env.DAILY_CHANNEL_ID
  const departISO = process.env.MAX_DEPART;

  if (!channelId || !departISO) {
    console.error("❌ DAILY_CHANNEL_ID ou MAX_DEPART manquant dans .env");
    return;
  }

  const channel = client.channels.cache.get(channelId) as TextChannel;
  if (!channel) {
    console.error("❌ Salon introuvable pour le message quotidien.");
    return;
  }

  // 🗂️ Charger les phrases du fichier JSON
  const messagesPath = path.join(__dirname, "../../data/daily_messages.json");
  let phrases: string[] = [];

  try {
    const data = fs.readFileSync(messagesPath, "utf8");
    phrases = JSON.parse(data).messages;
  } catch (error) {
    console.error("❌ Impossible de lire daily_messages.json :", error);
  }

  // 🎲 Choisir une phrase aléatoire
  const randomPhrase =
    phrases.length > 0
      ? phrases[Math.floor(Math.random() * phrases.length)]
      : "Maxime continue son aventure australienne 🌏";

  // 📅 Calcul du nombre de jours
  const departDate = DateTime.fromISO(departISO).startOf("day");
  const today = DateTime.now().startOf("day");
  const diffDays = Math.floor(today.diff(departDate, "days").days);

  // 🔹 Formater la date en français
  const formattedDepartDate = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(departDate.toJSDate());

  let messageText: string;

  if (diffDays < 0) {
    // Avant le départ
    messageText = `📅 **Message du jour — MaxTripBot**\n\n<@328795495936032768> n’est pas encore parti pour l’Australie 🇦🇺\n\nDépart prévu le **${formattedDepartDate}**.`;
  } else if (diffDays === 0) {
    // Jour du départ
    messageText = `📅 **Message du jour — MaxTripBot**\n\n🛫 Aujourd’hui, <@328795495936032768> part pour l’Australie 🇦🇺 !`;
  } else {
    // Après le départ
    messageText = `📅 **Message du jour — MaxTripBot**\n\nCela fait maintenant **${diffDays} jours** depuis le départ de <@328795495936032768> en Australie 🇦🇺\nIl a reçu **${total} MaxLove** 💖 !\n\n${randomPhrase}\n\nDate de départ : ${formattedDepartDate}`;
  }

  await channel.send(messageText);
  console.log(`✅ Message quotidien envoyé dans #${channel.name}`);
}
