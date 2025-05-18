// events/interactionCreate.js
import { enqueue, tryMatch } from './utils/ticketManager.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(client, interaction) {
  // Handle button interactions for tickets
  if (interaction.isButton()) {
    const thread = interaction.channel;
    if (!thread.isThread()) return;

    const [ , u1, u2 ] = thread.name.split('-');

    switch (interaction.customId) {
      case 'skip':
        await thread.send('🔄 Skipping session…');
        await thread.delete();
        enqueue(u1);
        enqueue(u2);
        await tryMatch(client);
        break;

      case 'report':
        await interaction.reply({
          content: `<@&${client.config.modRoleId}> A report has been filed.`,
          ephemeral: false
        });
        break;

      case 'end':
        await thread.send('❌ Session ended.');
        await thread.delete();
        break;
    }
    return;
  }

  // Dispatch slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        await interaction.reply({
          content: '⚠️ There was an error executing that command.',
          ephemeral: true
        });
      }
    }
  }
}