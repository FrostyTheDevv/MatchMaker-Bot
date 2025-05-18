// commands/match.js
import { SlashCommandBuilder } from 'discord.js';
import db from '../utils/db.js';
import { enqueue, tryMatch } from './utils/ticketManager.js';

export const data = new SlashCommandBuilder()
  .setName('match')
  .setDescription('Enter the matchmaking queue for a random chat.');

export async function execute(interaction) {
  // Restrict to designated channel
  if (interaction.channel.id !== interaction.client.config.matchmakingChannelId) {
    return interaction.reply({
      content: '❌ Please use the designated matchmaking channel.',
      ephemeral: true
    });
  }

  // Ensure user has an approved profile
  const profile = db.prepare(`
    SELECT 1 FROM profiles
    WHERE user_id = ? AND approved = 1
  `).get(interaction.user.id);

  if (!profile) {
    return interaction.reply({
      content: '🚫 You need an **approved** profile to join the queue.',
      ephemeral: true
    });
  }

  // Enqueue and attempt match
  enqueue(interaction.user.id);
  await interaction.reply({
    content: '✅ You’ve been added to the queue—waiting for a partner…',
    ephemeral: true
  });
  await tryMatch(interaction.client);
}