// index.js
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});
client.config   = config;
client.commands = new Collection();

// 🔍 Dynamic command loading
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const commandModule = await import(`./commands/${file}`);
  const { data, execute } = commandModule;
  client.commands.set(data.name, { data, execute });
}

// 🔍 Dynamic event loading
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const eventModule = await import(`./events/${file}`);
  const { name, once, execute } = eventModule;
  if (once) client.once(name, (...args) => execute(client, ...args));
  else      client.on(name,   (...args) => execute(client, ...args));
}

// 🚀 Log in
client.login(config.token);