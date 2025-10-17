import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getDataPayload } from "../../utils/dataPayload";
import { DateTime } from "luxon";

interface OpenMeteoResponse {
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
}

export const data = new SlashCommandBuilder()
  .setName("maxweather")
  .setDescription("Affiche la météo actuelle à la localisation de Maxime (Open-Meteo)");
export const aliases = ["maxweather"];

export async function execute({ interaction }: { interaction: any }) {
  await interaction.deferReply();

  try {
    const [locality, country, lat, lon] = await Promise.all([
      getDataPayload("location.locality", true),
      getDataPayload("location.country", true),
      getDataPayload("location.lat", true),
      getDataPayload("location.lon", true),
    ]);

    const location = `${locality ?? "Lieu inconnu"}${country ? `, ${country}` : ""}`;
    const latitude = Number(lat) || -31.57;
    const longitude = Number(lon) || 115.52;

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: OpenMeteoResponse = await response.json();
    const cw = data.current_weather;
    if (!cw) return interaction.editReply("❌ Impossible de récupérer la météo actuelle.");

    const { temperature, windspeed, weathercode } = cw;
    const { description, emoji } = weathercodeToTextAndEmoji(weathercode);
    const tempEmoji = temperature >= 30 ? "🔥" : temperature <= 10 ? "❄️" : "🌡️";

    const now = new Date().toLocaleString("fr-FR");
    console.log(`📦 [${now}] (/maxweather) Données récupérées :`, {
      locality,
      country,
      latitude,
      longitude,
      tempEmoji,
      temperature,
      windspeed,
      weathercode,
      description,
    });

    const embed = new EmbedBuilder()
      .setTitle(`🌤️ Météo à ${location}`)
      .setColor(0x1e90ff)
      .addFields(
        {
          name: "Température",
          value: `${tempEmoji} ${temperature}°C`,
          inline: true,
        },
        { name: "Vent", value: `💨 ${windspeed} m/s`, inline: true },
        { name: "Conditions", value: `${emoji} ${description}`, inline: false }
      )
      .setFooter({ text: "Données fournies par Open-Meteo" })
      .setTimestamp(DateTime.now().toJSDate());

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("Erreur météo :", err);
    const replies = [
      "📡 Les satellites sont perturbés... impossible de capter la météo.",
      "🛰️ Transmission météo interrompue.",
      "🌪️ Impossible d’obtenir la météo, brouillage détecté.",
      "🚨 Données météo inaccessibles.",
      "📡 Brouillage satellite détecté.",
    ];
    const msg = replies[Math.floor(Math.random() * replies.length)];
    await interaction.editReply(msg);
  }
}

function weathercodeToTextAndEmoji(code: number): {
  description: string;
  emoji: string;
} {
  const map: Record<number, { description: string; emoji: string }> = {
    0: { description: "Ciel clair", emoji: "☀️" },
    1: { description: "Principalement clair", emoji: "🌤️" },
    2: { description: "Partiellement nuageux", emoji: "⛅" },
    3: { description: "Couvert", emoji: "☁️" },
    45: { description: "Brouillard", emoji: "🌫️" },
    48: { description: "Brouillard givrant", emoji: "🌁" },
    51: { description: "Bruine légère", emoji: "🌦️" },
    53: { description: "Bruine modérée", emoji: "🌧️" },
    55: { description: "Bruine dense", emoji: "🌧️" },
    56: { description: "Verglas léger", emoji: "🌨️" },
    57: { description: "Verglas dense", emoji: "🌨️" },
    61: { description: "Pluie légère", emoji: "🌦️" },
    63: { description: "Pluie modérée", emoji: "🌧️" },
    65: { description: "Pluie forte", emoji: "🌧️" },
    66: { description: "Pluie verglaçante légère", emoji: "🌨️" },
    67: { description: "Pluie verglaçante forte", emoji: "🌨️" },
    71: { description: "Neige légère", emoji: "❄️" },
    73: { description: "Neige modérée", emoji: "❄️" },
    75: { description: "Neige forte", emoji: "❄️" },
    80: { description: "Averses légères", emoji: "🌦️" },
    81: { description: "Averses modérées", emoji: "🌧️" },
    82: { description: "Averses fortes", emoji: "🌧️" },
    95: { description: "Orage", emoji: "⛈️" },
    96: { description: "Orage léger", emoji: "🌩️" },
    99: { description: "Orage fort", emoji: "🌩️" },
  };
  return map[code] ?? { description: "Temps inconnu", emoji: "❔" };
}
