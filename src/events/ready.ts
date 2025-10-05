import type { Client } from "discord.js";

export function registerEvents(client: Client) {
  client.once("ready", () => {
    console.log(`✅ Connecté en tant que ${client.user?.tag}`);
  });
}
