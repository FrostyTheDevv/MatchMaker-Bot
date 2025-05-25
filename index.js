// index.js
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 1️⃣ Create the Discord client
const client = new Client({
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages ],
  partials: [ Partials.Channel ]
});
client.config   = config;
client.commands = new Collection();

// 0️⃣ Ready handler in index.js
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

(async () => {
  // 2️⃣ Load command modules and prepare REST registration data
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const imported = await import(`./commands/${file}`);
    // support both `export default { data, execute }` and named exports
    const command = imported.default ?? imported;
    const { data, execute } = command;
    if (!data || !execute) {
      console.warn(`Skipping ${file}: missing data or execute export`);
      continue;
    }
    client.commands.set(data.name, { data, execute });
    commands.push(data.toJSON());
  }

  // 3️⃣ Register slash commands with Discord
  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    console.log(`🔄 Refreshing ${commands.length} slash commands…`);
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
    console.log('✅ Slash commands registered.');
  } catch (err) {
    console.error('❌ Failed to register slash commands:', err);
  }

  // 4️⃣ Load event handlers
  const eventsPath = path.join(__dirname, 'events');
  for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
    const imported = await import(`./events/${file}`);
    const event    = imported.default ?? imported;
    const { name, once, execute } = event;
    if (!name || !execute) {
      console.warn(`Skipping event file ${file}: missing name or execute`);
      continue;
    }
    if (once) client.once(name,   (...args) => execute(client, ...args));
    else      client.on (name,   (...args) => execute(client, ...args));
  }

  // 5️⃣ Log in
  await client.login(config.token);
})();

// Final catch-all for unexpected errors
process.on('unhandledRejection', err => console.error('Unhandled promise:', err));
