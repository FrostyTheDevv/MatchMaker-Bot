// commands/viewprofile.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDb } from '../events/utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('viewprofile')
  .setDescription("DMs you another user's approved dating profile.")
  .addUserOption(opt =>
    opt
      .setName('user')
      .setDescription('Select a user to view their profile')
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    // Defer so we have time to fetch from DB and DM
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser('user');
    const db     = await getDb();

    // Fetch all profile fields, including new ones
    const stmt = db.prepare(`
      SELECT name, age, gender, orientation, bdsm_prefs, bio, avatar_url
      FROM profiles
      WHERE user_id = ? AND approved = 1;
    `);
    const p = stmt.get(target.id);

    if (!p) {
      return interaction.editReply({
        content: '🚫 That user has no **approved** profile.'
      });
    }

    // Destructure with defaults and coerce all to strings
    const name        = String(p.name ?? target.username);
    const age         = String(p.age ?? 'N/A');
    const gender      = String(p.gender ?? 'N/A');
    const orientation = String(p.orientation ?? 'Not specified');
    const bdsmPrefs   = String(p.bdsm_prefs ?? 'None');
    const bio         = String(p.bio ?? 'No bio provided.');
    const avatarUrl   = p.avatar_url || target.displayAvatarURL({ dynamic: true, size: 128 });

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(`${name}'s Profile`)
      .setColor('#FF69B4')
      .setThumbnail(avatarUrl)
      .addFields([
        { name: 'Name',        value: name,        inline: true },
        { name: 'Age',         value: age,         inline: true },
        { name: 'Gender',      value: gender,      inline: true },
        { name: 'Orientation', value: orientation, inline: true },
        { name: 'BDSM Prefs',  value: bdsmPrefs,   inline: true },
        { name: 'Bio',         value: bio,         inline: false }
      ])
      .setFooter({ text: 'Matchmaker • Bringing people together' })
      .setTimestamp();

    // Try to DM the user
    try {
      await interaction.user.send({ embeds: [embed] });
      // Acknowledge via editReply since we deferred
      await interaction.editReply({
        content: `✅ DMed you **${name}**’s profile!`
      });
    } catch {
      await interaction.editReply({
        content: '❌ Could not DM you—do you have DMs disabled?'
      });
    }
  } catch (err) {
    console.error('Error in /viewprofile command:', err);
    if (interaction.deferred) {
      await interaction.editReply({
        content: '⚠️ There was an error fetching that profile.'
      });
    } else {
      await interaction.reply({
        content: '⚠️ There was an error fetching that profile.',
        ephemeral: true
      });
    }
  }
}
