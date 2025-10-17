import fs from "fs";
import path from "path";
import type { Message } from "discord.js";
import type { ExtendedClient } from "../types/ExtendedClient";

interface Command {
  data: { name: string; description?: string };
  aliases?: string[];
  execute: (options: { message?: Message; client: ExtendedClient }) => Promise<void>;
}

export async function handleMessage(client: ExtendedClient) {
  const commandsPath = path.join(__dirname, "../commands/slash");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  const commandModules = new Map<string, Command>();

  for (const file of commandFiles) {
    const command: Command = await import(path.join(commandsPath, file));
    commandModules.set(command.data.name.toLowerCase(), command);
    command.aliases?.forEach((alias) => commandModules.set(alias.toLowerCase(), command));
  }

  client.on("messageCreate", async (message: Message) => {
    if (!message.content.startsWith(client.prefix) || message.author.bot) return;

    const args = message.content.slice(client.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = commandModules.get(commandName);
    if (!command) return;

    try {
      await command.execute({ message, client });
      console.log(`Commande ${commandName} exécutée par ${message.author.tag}`);
    } catch (error) {
      console.error(error);
      await message.reply("Une erreur est survenue lors de l'exécution de la commande.");
    }
  });
}
