// commands/help.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show a list of all available commands.');

export async function execute(interaction) {
  // Build an embed listing each command’s name & description
  const helpEmbed = new EmbedBuilder()
    .setTitle('🤖 Matchmaker Bot — Help')
    .setDescription('Here are all my commands:')
    .setColor('#5865F2')
    .setTimestamp();

  // Pull commands from the client’s command collection
  for (const [, cmd] of interaction.client.commands) {
    const { name, description } = cmd.data;
    helpEmbed.addFields({ name: `/${name}`, value: description, inline: false });
  }

  await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
}
