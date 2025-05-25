// events/interactionCreate.js
import pkg from 'discord.js';
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = pkg;
import { getDb, saveDb } from './utils/db.js';  // corrected path

export default {
  name: 'interactionCreate',
  once: false,

  /**
   * @param {import('../index').ClientWithConfig} client
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(client, interaction) {
    // ────────────────────────────────────────────────
    // 1️⃣ Button handlers (skip, report, end)
    // ────────────────────────────────────────────────
    if (interaction.isButton()) {
      const chan = interaction.channel;
      if (
        chan.type !== ChannelType.GuildText ||
        !chan.name.startsWith('match-')
      ) return;

      const [, u1, u2] = chan.name.split('-');

      switch (interaction.customId) {
        case 'skip':
          // Acknowledge the button
          await interaction.deferUpdate();
          await chan.send('🔄 Skipping session…');
          await chan.delete();
          await enqueueAndTry(client, u1, u2);
          break;

        case 'report':
          // Reply ephemerally
          await interaction.reply({
            content: `<@&${client.config.modRoleId}> A report has been filed.`,
            ephemeral: true
          });
          break;

        case 'end':
          await interaction.deferUpdate();
          await chan.send('❌ Session ended.');
          await chan.delete();
          break;
      }
      return;
    }

    // ────────────────────────────────────────────────
    // 2️⃣ Slash commands: dispatch dynamically
    // ────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction);
      } catch (err) {
        console.error(`Error executing /${interaction.commandName}`, err);
        if (!interaction.replied) {
          await interaction.reply({
            content: '⚠️ There was an error running that command.',
            ephemeral: true
          });
        }
      }
    }
  }
};

/**
 * Button helper to re-enqueue two users and immediately try a new match.
 */
async function enqueueAndTry(client, u1, u2) {
  const db = await getDb();
  db.run('INSERT OR IGNORE INTO queue(user_id) VALUES (?);', [u1]);
  db.run('INSERT OR IGNORE INTO queue(user_id) VALUES (?);', [u2]);
  saveDb();
  await attemptMatchCreateChannel(client);
}

/**
 * Background: pull two from queue, delete, create channel & send embed/buttons.
 */
async function attemptMatchCreateChannel(client) {
  const db  = await getDb();
  const res = db.exec('SELECT user_id FROM queue;')[0];
  const rows = (res?.values || []).map(([uid]) => ({ user_id: uid }));
  if (rows.length < 2) return;

  const [a, b] = rows.sort(() => Math.random() - 0.5).slice(0, 2);
  db.run('DELETE FROM queue WHERE user_id IN (?,?);', [a.user_id, b.user_id]);
  saveDb();

  const guild = await client.guilds.fetch(client.config.guildId);
  await Promise.all([
    guild.members.fetch(a.user_id),
    guild.members.fetch(b.user_id),
    guild.roles.fetch(client.config.modRoleId).catch(() => null)
  ]);

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: a.user_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    { id: b.user_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    {
      id: client.config.modRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];

  const ch = await guild.channels.create({
    name: `match-${a.user_id}-${b.user_id}`,
    type: ChannelType.GuildText,
    parent: client.config.ticketCategoryId,
    permissionOverwrites: overwrites
  });

  const [uA, uB] = await Promise.all([
    client.users.fetch(a.user_id),
    client.users.fetch(b.user_id)
  ]);

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
    new ButtonBuilder().setCustomId('skip').setLabel('🔄 Skip').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('report').setLabel('🚩 Report').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('end').setLabel('❌ End').setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [controls] });
}
