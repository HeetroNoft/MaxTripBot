import type { Client } from "discord.js";

export function registerEvents(client: Client) {
  client.once("clientReady", () => {
    console.log(`✅ Connecté en tant que ${client.user?.tag}`);
  });
}
