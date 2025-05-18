// config.js
// Static IDs and settings loaded from environment variables.

export default {
  token: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  matchmakingChannelId: process.env.MATCHMAKING_CHANNEL_ID,
  ticketCategoryId: process.env.TICKET_CATEGORY_ID,
  modRoleId: process.env.MOD_ROLE_ID,
};