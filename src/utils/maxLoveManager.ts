// src/utils/MaxLoveManager.ts
import fs from "fs";
import { DateTime } from "luxon";
import path from "path";

const DATA_DIR = path.join(__dirname, "../../data");
const FILE = path.join(DATA_DIR, "maxlove_history.json");

// Créer le dossier si nécessaire
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Structure des données
interface UserData {
  count: number;
  lastUsed: number;
  history: number[]; // nouveau : liste des timestamps
}

interface MaxLoveData {
  [userId: string]: UserData;
}

// Charger les données
let data: MaxLoveData = {};
try {
  const fileContent = fs.readFileSync(FILE, "utf-8");
  data = JSON.parse(fileContent);
} catch {
  data = {};
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// Fonctions
export function addMaxLove(userId: string) {
  if (!data[userId]) data[userId] = { count: 0, lastUsed: 0, history: [] };
  const now = Date.now();
  data[userId].count++;
  data[userId].lastUsed = now;
  data[userId].history.push(now); // ajouter le timestamp
  saveData();
}

export function getMaxLoveCount(userId?: string) {
  if (userId) return data[userId]?.count || 0;
  // total global
  return Object.values(data).reduce((sum, u) => sum + (u.count || 0), 0);
}

export function getMaxLoveLeaderboard(top = 5) {
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, top);
  return sorted.map(([userId, u]) => [userId, u.count] as [string, number]);
}

// Cooldown
const COOLDOWN_DURATION = 3600000; // 1h

export function canUseMaxLove(userId: string) {
  const lastUsed = data[userId]?.lastUsed || 0;
  return Date.now() - lastUsed >= COOLDOWN_DURATION;
}

export function getCooldownRemaining(userId: string) {
  const lastUsed = data[userId]?.lastUsed || 0;
  const remaining = COOLDOWN_DURATION - (Date.now() - lastUsed);
  return remaining > 0 ? remaining : 0;
}

export async function getRank({
  maxLove,
  dataReturn,
  evolved = false,
}: {
  maxLove?: number;
  dataReturn:
    | "color"
    | "minLove"
    | "name"
    | "emoji"
    | "rank"
    | "nextRank"
    | "ranks";
  evolved?: boolean;
}): Promise<any> {
  const RANKS = [
    { minLove: 0, name: "Novice", emoji: "🌱", color: 0x808080 },
    { minLove: 50, name: "Cuivre", emoji: "🟠", color: 0x8a4000 },
    { minLove: 100, name: "Bronze", emoji: "🥉", color: 0x8a5700 },
    { minLove: 250, name: "Silver", emoji: "🥈", color: 0xebebeb },
    { minLove: 500, name: "Gold", emoji: "🥇", color: 0xffb700 },
    { minLove: 800, name: "Platine", emoji: "🔷", color: 0x006acf },
    { minLove: 1200, name: "Émeraude", emoji: "💚", color: 0x48c849 },
    { minLove: 2000, name: "Diamant", emoji: "💎", color: 0x2bdcff },
    { minLove: 3000, name: "Légende", emoji: "🌟", color: 0xea00ff },
  ];

  let currentRank = null;
  let nextRank = null;
  if (maxLove) {
    currentRank = RANKS.filter((r) => maxLove >= r.minLove).at(-1) ?? RANKS[0];
    nextRank = RANKS.find((r) => r.minLove > maxLove);
    if (evolved && nextRank && maxLove === currentRank.minLove)
      return `${currentRank.emoji} ${currentRank.name} ➔ ${nextRank.emoji} ${nextRank.name}`;
  }

  switch (dataReturn) {
    case "color":
      return currentRank ? currentRank.color : undefined;
    case "minLove":
      return currentRank ? currentRank.minLove : undefined;
    case "name":
      return currentRank ? currentRank.name : undefined;
    case "emoji":
      return currentRank ? currentRank.emoji : undefined;
    case "rank":
      return currentRank
        ? `${currentRank.emoji} ${currentRank.name}`
        : undefined;
    case "nextRank":
      return nextRank;
    case "ranks":
      return RANKS;
  }
}

// Nouvelle fonction : stats par jour
export function getMaxLoveStatsPerDay() {
  const stats: Record<string, number> = {}; // { "2025-10-14": 5 }

  Object.values(data).forEach((user) => {
    user.history.forEach((timestamp) => {
      const day = DateTime.fromMillis(timestamp)
        .setZone("Europe/Paris")
        .toISODate() as string; // format "YYYY-MM-DD" en heure française
      stats[day] = (stats[day] || 0) + 1;
    });
  });

  return stats;
}

// Sauvegarde
function saveData() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}
