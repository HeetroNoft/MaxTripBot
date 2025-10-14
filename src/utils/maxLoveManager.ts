// src/utils/MaxLoveManager.ts
import fs from "fs";
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

// Nouvelle fonction : stats par jour
export function getMaxLoveStatsPerDay() {
  const stats: Record<string, number> = {}; // { "2025-10-14": 5 }

  Object.values(data).forEach((user) => {
    user.history.forEach((timestamp) => {
      const day = new Date(timestamp).toISOString().split("T")[0]; // YYYY-MM-DD
      stats[day] = (stats[day] || 0) + 1;
    });
  });

  return stats;
}

// Sauvegarde
function saveData() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}
