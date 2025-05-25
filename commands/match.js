// commands/match.js
import pkg from 'discord.js';
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = pkg;

import { getDb, saveDb } from '../events/utils/db.js';
import config from '../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('match')
    .setDescription('Enter the matchmaking queue for a random chat.')
    .addStringOption(opt =>
      opt
        .setName('gender')
        .setDescription('Your gender for pairing')
        .setRequired(true)
        .addChoices(
          { name: 'Male',   value: 'male' },
          { name: 'Female', value: 'female' }
        )
    ),

  async execute(interaction) {
    const client = interaction.client;
    const gender = interaction.options.getString('gender');

    // 1️⃣ Immediately acknowledge so Discord won’t time out
    await interaction.reply({
      content: '🔄 Joining the queue…',
      ephemeral: true
    });

    try {
      const db = await getDb();

      // 2️⃣ Ensure `queue` table exists with both `gender` & `joined` columns
      db.exec(`
        CREATE TABLE IF NOT EXISTS queue (
          user_id TEXT PRIMARY KEY,
          gender  TEXT,
          joined  INTEGER
        );
      `);

      // 3️⃣ If this is an older DB without those columns, add them as nullable
      const pragma = db.exec("PRAGMA table_info('queue');")[0];
      const cols = (pragma?.values || []).map(row => row[1]);

      if (!cols.includes('gender')) {
        db.exec("ALTER TABLE queue ADD COLUMN gender TEXT;");
      }
      if (!cols.includes('joined')) {
        db.exec("ALTER TABLE queue ADD COLUMN joined INTEGER;");
      }

      // 4️⃣ Upsert this user into the queue with their gender & timestamp
      const now = Date.now();
      db.prepare(`
        INSERT INTO queue(user_id, gender, joined)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          gender = excluded.gender,
          joined = excluded.joined
      `).run(interaction.user.id, gender, now);
      saveDb();

      // 5️⃣ Tell them they’re in the queue
      await interaction.followUp({
        content:
          '✅ You’re in the queue! Waiting for an opposite-gender match…',
        ephemeral: true
      });

      // 6️⃣ Announce publicly in the matchmaking channel
      const mmChan = await client.channels.fetch(config.matchmakingChannelId);
      if (mmChan.isTextBased()) {
        await mmChan.send(
          `✅ <@${interaction.user.id}> has joined the matchmaking queue!`
        );
      }

      // 7️⃣ Background: attempt to match & create channel
      await attemptMatchCreateChannel(client);

    } catch (err) {
      console.error('Error in /match command:', err);
      await interaction.followUp({
        content: '⚠️ Something went wrong while joining the queue.',
        ephemeral: true
      });
    }
  }
};

/**
 * Pull one male + one female from queue, delete them,
 * create a private channel with proper perms, and send the embed + buttons.
 */
async function attemptMatchCreateChannel(client) {
  const db  = await getDb();
  const res = db.exec('SELECT user_id, gender FROM queue;')[0];
  const rows = (res?.values || []).map(([user_id, gender]) => ({ user_id, gender }));
  if (rows.length < 2) return;

  // Separate by gender
  const males   = rows.filter(r => r.gender === 'male');
  const females = rows.filter(r => r.gender === 'female');
  if (!males.length || !females.length) return; // need one of each

  // Pick one at random from each list
  const a = males[Math.floor(Math.random() * males.length)];
  const b = females[Math.floor(Math.random() * females.length)];

  // Remove both from queue
  db.run('DELETE FROM queue WHERE user_id IN (?,?);', [a.user_id, b.user_id]);
  saveDb();

  // Fetch guild & ensure permissions resolvable
  const guild = await client.guilds.fetch(config.guildId);
  await Promise.all([
    guild.members.fetch(a.user_id),
    guild.members.fetch(b.user_id),
    guild.roles.fetch(config.modRoleId).catch(() => null)
  ]);

  // Build permission overwrites
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: a.user_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    { id: b.user_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    {
      id: config.modRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];

  // Create the private text channel
  const ch = await guild.channels.create({
    name: `match-${a.user_id}-${b.user_id}`,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId,
    permissionOverwrites: overwrites
  });

  // Fetch user objects for avatars/mentions
  const [uA, uB] = await Promise.all([
    client.users.fetch(a.user_id),
    client.users.fetch(b.user_id)
  ]);

  // Build & send the match embed + controls
  const embed = new EmbedBuilder()
    .setColor('#FFB6C1')
    .setAuthor({ name: '💘 Matchmaker', iconURL: client.user.displayAvatarURL() })
    .setTitle('You’ve Been Matched!')
    .setDescription(`Welcome <@${a.user_id}> and <@${b.user_id}>!`)
    .setThumbnail(uA.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: 'Partner 1', value: `<@${a.user_id}>`, inline: true },
      { name: 'Partner 2', value: `<@${b.user_id}>`, inline: true }
    )
    .setFooter({ text: 'Use the buttons below to manage your session.' })
    .setTimestamp();

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('skip')
      .setLabel('🔄 Skip')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('report')
      .setLabel('🚩 Report')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('end')
      .setLabel('❌ End')
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [controls] });
}

/**
 * Exposed helper for your button handler to re-enqueue and re-match two users.
 */
export async function enqueueAndTry(client, u1, u2) {
  const db = await getDb();
  db.run('INSERT OR IGNORE INTO queue(user_id) VALUES (?);', [u1]);
  db.run('INSERT OR IGNORE INTO queue(user_id) VALUES (?);', [u2]);
  saveDb();
  await attemptMatchCreateChannel(client);
}
