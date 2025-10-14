import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fs from "fs-extra";
import path from "path";

// Interface pour typer la réponse Open-Meteo
interface OpenMeteoResponse {
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
}

// Commande Slash
export const data = new SlashCommandBuilder()
  .setName("maxweather")
  .setDescription(
    "Affiche la météo actuelle à la localisation de Maxime (avec Open-Meteo)"
  );
export const aliases = ["maxweather"];

export async function execute({ interaction, message }: any) {
  await interaction.deferReply();

  try {
    const PAYLOAD_FILE = path.resolve("./data/payload.json");
    // Coordonnées de Maxime (exemple : Perth, Australie)
    const latestStep = (await fs.readJson(PAYLOAD_FILE)).steps.sort(
      (a: any, b: any) =>
        new Date(b.start_time || b.creation_time).getTime() -
        new Date(a.start_time || a.creation_time).getTime()
    )[0];

    if (!latestStep) {
      return interaction.editReply(
        "😕 Impossible de trouver la dernière step sur Polarsteps."
      );
    }

    const lat = latestStep.location.lat || -31.57;
    const lon = latestStep.location.lon || 115.52;

    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current_weather: "true",
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data: OpenMeteoResponse = await response.json();
    const cw = data.current_weather;

    if (!cw) {
      await interaction.editReply(
        "❌ Impossible de récupérer la météo actuelle."
      );
      return;
    }

    const temp = cw.temperature;
    const windspeed = cw.windspeed;
    const weathercode = cw.weathercode;

    // Déterminer description météo + emoji
    const { description, emoji } = weathercodeToTextAndEmoji(weathercode);

    // Ajouter un emoji chaud/froid selon la température
    let tempEmoji = "🌡️"; // neutre
    if (temp >= 30) tempEmoji = "🔥";
    else if (temp <= 10) tempEmoji = "❄️";

    // 🔹 Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle(`🌤️ Météo à Perth`)
      .setColor("#1E90FF")
      .addFields(
        { name: "Température", value: `${tempEmoji} ${temp}°C`, inline: true },
        { name: "Vent", value: `💨 ${windspeed} m/s`, inline: true },
        { name: "Conditions", value: `${emoji} ${description}`, inline: false }
      )
      .setFooter({ text: "Données fournies par Open-Meteo" });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Erreur météo Open-Meteo :", error);

    const funnyReplies = [
      "📡 Les satellites sont perturbés... impossible de capter la météo, mayday mayday !",
      "🛰️ Transmission météo interrompue... les satellites ont perdu Maxime ! 😵‍💫",
      "🌪️ Mayday mayday ! Impossible d’obtenir la météo, la connexion avec les satellites est partie en vacances 🏖️",
      "🚨 Alerte météo : brouillage total des satellites, impossible de savoir s’il fait beau ou s’il pleut des kangourous 🦘🌧️",
      "📡 Les signaux météo sont brouillés ! Peut-être que Maxime est trop loin dans l’outback… 🏜️",
    ];
    const random =
      funnyReplies[Math.floor(Math.random() * funnyReplies.length)];
    await interaction.editReply(random);
  }
}

// Helper : traduire les codes météo Open-Meteo en texte + emoji
function weathercodeToTextAndEmoji(code: number): {
  description: string;
  emoji: string;
} {
  const map: { [key: number]: { description: string; emoji: string } } = {
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
