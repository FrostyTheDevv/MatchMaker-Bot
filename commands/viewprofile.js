// commands/viewprofile.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('viewprofile')
  .setDescription("DMs you another user's approved dating profile.")
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Select a user to view their profile')
      .setRequired(true)
  );

export async function execute(interaction) {
  const target = interaction.options.getUser('user');

  // Fetch approved profile
  const profile = db.prepare(`
    SELECT name, age, gender, bio
    FROM profiles
    WHERE user_id = ? AND approved = 1
  `).get(target.id);

  if (!profile) {
    return interaction.reply({
      content: '🚫 That user has no **approved** profile.',
      ephemeral: true
    });
  }

  // Build and DM the profile embed
  const embed = new EmbedBuilder()
    .setTitle(`${profile.name}'s Profile`)
    .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 128 }))
    .addFields(
      { name: 'Name',   value: profile.name, inline: true },
      { name: 'Age',    value: `${profile.age}`, inline: true },
      { name: 'Gender', value: profile.gender, inline: true },
      { name: 'Bio',    value: profile.bio }
    )
    .setFooter({ text: 'Matchmaker • Bringing people together' })
    .setTimestamp();

  try {
    await interaction.user.send({ embeds: [embed] });
    await interaction.reply({
      content: `✅ DMed you **${profile.name}**’s profile!`,
      ephemeral: true
    });
  } catch {
    await interaction.reply({
      content: '❌ Could not DM you—do you have DMs disabled?',
      ephemeral: true
    });
  }
}