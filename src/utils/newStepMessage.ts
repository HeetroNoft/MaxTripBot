import { TextChannel, Client } from "discord.js";

export async function newStepMessage(client: Client) {
  const channelId = process.env.DAILY_CHANNEL_ID;

  if (!channelId) {
    console.error("❌ DAILY_CHANNEL_ID manquant dans .env");
    return;
  }

  const channel = client.channels.cache.get(channelId) as TextChannel;
  if (!channel) {
    console.error("❌ Salon introuvable pour le message quotidien.");
    return;
  }

  // 💬 Générer le message
  let messageText: string;
  messageText = `🚀 **Une nouvelle étape a été détectée sur le polarsteps !**\n\n*Utilise la commande **/maxstep** pour voir les dernières news de Maxime !*`;

  // 🚀 Envoi du message
  await channel.send(messageText);
  console.log(`✅ Message quotidien envoyé dans #${channel.name}`);
}
