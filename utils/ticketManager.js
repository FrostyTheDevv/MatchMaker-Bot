// utils/ticketManager.js
import {
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import db from './db.js';

// Add a user to the matchmaking queue
export function enqueue(userId) {
  db.prepare('INSERT OR IGNORE INTO queue(user_id) VALUES (?)')
    .run(userId);
}

// Attempt to match two users from the queue
export async function tryMatch(client) {
  const rows = db.prepare('SELECT user_id FROM queue').all();
  if (rows.length < 2) return;

  // Pick two distinct users at random
  const [a, b] = rows.sort(() => Math.random() - 0.5).slice(0, 2);
  db.prepare('DELETE FROM queue WHERE user_id IN (?, ?)')
    .run(a.user_id, b.user_id);

  // Create a private thread for the match
  const channel = await client.channels.fetch(client.config.matchmakingChannelId);
  const thread  = await channel.threads.create({
    name: `match-${a.user_id}-${b.user_id}`,
    autoArchiveDuration: 60,
    type: ChannelType.PrivateThread,
    reason: 'Matchmaking session'
  });

  // Invite both users
  await thread.members.add(a.user_id);
  await thread.members.add(b.user_id);

  // Send the match embed with controls
  const userA = await client.users.fetch(a.user_id);
  const userB = await client.users.fetch(b.user_id);

  const embed = new EmbedBuilder()
    .setColor('#FFB6C1')
    .setAuthor({
      name: '💘 Matchmaker',
      iconURL: client.user.displayAvatarURL()
    })
    .setTitle('You’ve Been Matched!')
    .setDescription(`Welcome <@${a.user_id}> and <@${b.user_id}>! Start chatting 😊`)
    .setThumbnail(userA.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: 'Partner 1', value: `<@${a.user_id}>`, inline: true },
      { name: 'Partner 2', value: `<@${b.user_id}>`, inline: true }
    )
    .setFooter({ text: 'Use the buttons below to control your session.' })
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

  await thread.send({ embeds: [embed], components: [controls] });
}