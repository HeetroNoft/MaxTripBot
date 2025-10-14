import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { DateTime } from "luxon";

export const data = new SlashCommandBuilder()
  .setName("maxword")
  .setDescription("Découvre un mot australien fun ou typique");

export const aliases = ["maxword", "ausword"];

export async function execute({ interaction }: any) {
  await interaction.deferReply();

  try {
    // 🔹 Récupérer la date de départ
    const departISO = process.env.MAX_DEPART;
    if (!departISO) {
      console.error("❌ MAX_DEPART manquant dans .env");
      return interaction.editReply(
        "❌ Impossible de récupérer la date de départ de Maxime."
      );
    }

    // 🕓 Gestion précise des fuseaux horaires
    const nowParis = DateTime.now().setZone("Europe/Paris");
    const today = nowParis.startOf("day");
    const departDate = DateTime.fromISO(departISO, {
      zone: "Europe/Paris",
    }).startOf("day");
    const diffDays = Math.floor(today.diff(departDate, "days").days);

    // 🔹 Si la date de départ n’est pas encore arrivée
    if (diffDays < 0) {
      const remainingDays = Math.ceil(Math.abs(diffDays));
      const embed = new EmbedBuilder()
        .setColor(0xff0059)
        .setTitle("⏳ MaxWord indisponible")
        .setDescription(
          `Hey ! Maxime n’est pas encore parti pour l’Australie 🇦🇺\n` +
            `Tu pourras découvrir le premier mot dans **${remainingDays} jour(s)**.`
        )
        .setFooter({ text: "MaxTripBot • Patience !" });

      return interaction.editReply({ embeds: [embed] });
    }

    // 🔹 Récupérer la liste des mots
    const filePath = path.join(__dirname, "../../../data/australianWords.json");
    const fileData = fs.readFileSync(filePath, "utf-8");
    const words = JSON.parse(fileData);

    // 🔹 Déterminer le mot du jour
    const index = diffDays % words.length; // Pour boucler si diffDays > words.length
    const todayWord = words[index];

    // 🔹 Créer un embed
    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle(`${todayWord.word} ${todayWord.emoji}`)
      .setDescription(`Signification : **${todayWord.meaning}**`)
      .setFooter({
        text: `Découvre un mot australien avec Maxime • Mot ${index + 1} / ${
          words.length
        }`,
      });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("Erreur maxword :", err);
    await interaction.editReply(
      "❌ Oops, impossible de récupérer un mot australien !"
    );
  }
}
