import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from 'discord.js';
import { handleEnable, handleDisable, handleSettings } from './handlers';

export const commands = [
  new SlashCommandBuilder()
    .setName('enable')
    .setDescription('Enable LiveLaunch features (Administrator only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName('notifications')
        .setDescription('Channel to send notifications to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('news')
        .setDescription('Channel to send news to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('messages')
        .setDescription('Channel to send streams to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('events')
        .setDescription('Maximum amount of events to create [1-50]')
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('disable')
    .setDescription('Disable LiveLaunch features (Administrator only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName('settings')
    .setDescription('View current LiveLaunch settings')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('next')
    .setDescription('Show the next upcoming launch or event')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information about LiveLaunch')
    .toJSON(),
];

export async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName } = interaction;

  switch (commandName) {
    case 'enable':
      await handleEnable(interaction);
      break;
    case 'disable':
      await handleDisable(interaction);
      break;
    case 'settings':
      await handleSettings(interaction);
      break;
    case 'next':
      await handleNext(interaction);
      break;
    case 'help':
      await handleHelp(interaction);
      break;
    default:
      await interaction.reply({ content: 'Unknown command', ephemeral: true });
  }
}

async function handleNext(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply({
    content: 'Next launch/event feature is coming soon!',
    ephemeral: true,
  });
}

async function handleHelp(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply({
    content: `**LiveLaunch Bot Help**

Commands:
\`/enable\` - Enable LiveLaunch features in your server
\`/disable\` - Disable LiveLaunch features
\`/settings\` - View current settings
\`/next\` - Show next upcoming launch/event
\`/help\` - Show this help message

Features:
• Automatic Discord scheduled events for launches
• YouTube livestream notifications
• Space news articles
• Launch countdown notifications
• Status change alerts

For more information, visit: https://github.com/juststephen/LiveLaunch`,
    ephemeral: true,
  });
}
