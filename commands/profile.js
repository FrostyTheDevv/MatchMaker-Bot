// commands/profile.js
import {
  SlashCommandBuilder,
  EmbedBuilder
} from 'discord.js';
import { getDb, saveDb } from '../events/utils/db.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('📝 Create or update your dating profile.')
  .addStringOption(opt =>
    opt
      .setName('name')
      .setDescription('👤 Your display name')
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt
      .setName('age')
      .setDescription('🎂 Your age')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('gender')
      .setDescription('⚧️ Your gender')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('sexuality')
      .setDescription('🌈 Your sexual orientation')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('love_language')
      .setDescription('💖 Your love language')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('likes')
      .setDescription('👍 Things you like')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt      .setName('dislikes')
      .setDescription('👎 Things you dislike')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('dm_status')
      .setDescription('📨 DM status (open/closed)')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('looking_for')
      .setDescription('🔍 What you\'re looking for')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('partner_wants')
      .setDescription('🤝 What you want in a partner')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('age_range')
      .setDescription('🔢 Preferred age range')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('bdsm_prefs')
      .setDescription('🔗 Your BDSM / kink preferences (or "None")')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('bio')
      .setDescription('🖋 Short bio (max 200 characters)')
      .setRequired(true)
      .setMaxLength(200)
  )
  .addAttachmentOption(opt =>
    opt
      .setName('picture_of_you')
      .setDescription('📷 Picture of YOU')
      .setRequired(true)
  );

export async function execute(interaction) {
  try {
    // Defer immediately so we can take our time with DB, uploads, etc.
    await interaction.deferReply({ ephemeral: true });

    // 1) Extract options
    const name           = interaction.options.getString('name');
    const age            = interaction.options.getInteger('age');
    const gender         = interaction.options.getString('gender');
    const sexuality      = interaction.options.getString('sexuality');
    const loveLanguage   = interaction.options.getString('love_language');
    const likes          = interaction.options.getString('likes');
    const dislikes       = interaction.options.getString('dislikes');
    const dmStatus       = interaction.options.getString('dm_status');
    const lookingFor     = interaction.options.getString('looking_for');
    const partnerWants   = interaction.options.getString('partner_wants');
    const ageRange       = interaction.options.getString('age_range');
    const bdsmPrefs      = interaction.options.getString('bdsm_prefs');
    const bio            = interaction.options.getString('bio');
    const picture        = interaction.options.getAttachment('picture_of_you');

    // 2) Validate attachment
    if (!picture.contentType?.startsWith('image/')) {
      return interaction.editReply({
        content: '🚫 The picture must be an image file.'
      });
    }
    const pictureUrl = picture.url;

    // 3) Save to DB
    const db = await getDb();
    db.run(
      `INSERT OR REPLACE INTO profiles
        (user_id,
         name, age, gender, sexuality,
         love_language, likes, dislikes, dm_status,
         looking_for, partner_wants, age_range,
         bdsm_prefs, bio,
         picture_url,
         approved)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0);`,
      [
        interaction.user.id,
        name, age, gender, sexuality,
        loveLanguage, likes, dislikes, dmStatus,
        lookingFor, partnerWants, ageRange,
        bdsmPrefs, bio,
        pictureUrl
      ]
    );
    saveDb();

    // 4) Acknowledge privately
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ Profile Submitted 💌')
          .setDescription(
            'Your profile has been sent for review. ' +
            'You’ll be notified once a moderator approves it.'
          )
          .setColor('#8B0000')
          .setTimestamp()
      ]
    });

    // 5) Publish to the profiles channel for moderators
    const modChanId = interaction.client.config.profilesChannelId;
    const modChan = await interaction.client.channels.fetch(modChanId);
    if (!modChan?.isTextBased()) return;

    const reviewEmbed = new EmbedBuilder()
      .setTitle('📝 New Dating Profile')
      .setThumbnail(pictureUrl)
      .setColor('#8B0000')
      .addFields(
        { name: '👤 User',            value: `<@${interaction.user.id}>`, inline: true },
        { name: '👤 Name',            value: name, inline: true },
        { name: '🎂 Age',             value: `${age}`, inline: true },
        { name: '⚧️ Gender',          value: gender, inline: true },
        { name: '🌈 Sexuality',       value: sexuality, inline: true },
        { name: '💖 Love Language',   value: loveLanguage, inline: true },
        { name: '👍 Likes',           value: likes, inline: true },
        { name: '👎 Dislikes',        value: dislikes, inline: true },
        { name: '📨 DM Status',       value: dmStatus, inline: true },
        { name: '🔍 Looking For',     value: lookingFor, inline: true },
        { name: '🤝 Partner Wants',   value: partnerWants, inline: true },
        { name: '🔢 Age Range',       value: ageRange, inline: true },
        { name: '🔗 BDSM Prefs',      value: bdsmPrefs, inline: true },
        { name: '🖋 Bio',             value: bio, inline: false }
      )
      .setFooter({ text: 'Use /approve or /reject to moderate.' })
      .setTimestamp();

    await modChan.send({ embeds: [reviewEmbed] });

  } catch (err) {
    console.error('Error in /profile command:', err);
    if (interaction.deferred) {
      await interaction.editReply({
        content: '⚠️ There was an error submitting your profile.'
      });
    } else {
      await interaction.reply({
        content: '⚠️ There was an error submitting your profile.',
        ephemeral: true
      });
    }
  }
}
