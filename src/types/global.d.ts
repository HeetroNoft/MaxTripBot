import type { Collection } from "discord.js";

declare module "discord.js" {
  export interface Client<Ready extends boolean = boolean> {
    commands: Collection<string, any>;
    prefix: string;
  }
}

declare module "*.js";
