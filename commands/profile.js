// commands/profile.js
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import db from '../utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Create or view your dating profile.');

export async function execute(interaction) {
  // Step 1: Multi-step profile creation
  const questions = [
    '🔹 What is your display name?',
    '🔹 How old are you?',
    '🔹 What is your gender?',
    '🔹 Write a short bio (max 200 chars).'
  ];
  const answers = [];
  const filter  = msg => msg.author.id === interaction.user.id;

  await interaction.reply({ content: questions[0], ephemeral: true });

  for (let i = 0; i < questions.length; i++) {
    const collected = await interaction.channel.awaitMessages({
      filter,
      max: 1,
      time: 120_000,
      errors: ['time']
    });
    answers.push(collected.first().content);
    if (i + 1 < questions.length) {
      await interaction.channel.send(questions[i + 1]);
    }
  }

  // Step 2: Save to DB (awaiting moderation)
  const [name, age, gender, bio] = answers;
  db.prepare(`
    INSERT OR REPLACE INTO profiles
      (user_id, name, age, gender, bio, approved)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(
    interaction.user.id,
    name,
    parseInt(age,  10),
    gender,
    bio
  );

  // Step 3: Acknowledge submission
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('📝 Profile Submitted')
    .setDescription(
      'Thanks! Your profile is now pending approval. ' +
      'A moderator will review it shortly and notify you here.'
    )
    .setFooter({ text: 'Matchmaker • Keeping connections safe' })
    .setTimestamp();

  await interaction.followUp({ embeds: [embed], ephemeral: true });
}