import {
  ChatInputCommandInteraction,
  TextChannel,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { enableGuildFeature, disableGuildFeature, getEnabledGuild } from '../db/queries';
import { logger } from '../utils/logger';

const WEBHOOK_AVATAR_PATH = 'LiveLaunch_Webhook_Avatar.png';

export async function handleEnable(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guild || !interaction.guildId) {
    await interaction.editReply('This command can only be used in a server.');
    return;
  }

  const notificationsChannel = interaction.options.getChannel('notifications') as TextChannel | null;
  const newsChannel = interaction.options.getChannel('news') as TextChannel | null;
  const messagesChannel = interaction.options.getChannel('messages') as TextChannel | null;
  const eventsCount = interaction.options.getInteger('events');

  if (!notificationsChannel && !newsChannel && !messagesChannel && !eventsCount) {
    await interaction.editReply(
      'Please specify at least one feature to enable: notifications, news, messages, or events.'
    );
    return;
  }

  const settings: Record<string, string | number> = {};

  try {
    // Check bot permissions
    const botMember = await interaction.guild.members.fetch(interaction.client.user.id);

    if (notificationsChannel) {
      const permissions = notificationsChannel.permissionsFor(botMember);
      if (
        !permissions?.has(PermissionFlagsBits.ManageWebhooks) ||
        !permissions?.has(PermissionFlagsBits.SendMessages) ||
        !permissions?.has(PermissionFlagsBits.EmbedLinks)
      ) {
        await interaction.editReply(
          `Missing required permissions in ${notificationsChannel}: Manage Webhooks, Send Messages, and Embed Links are required.`
        );
        return;
      }

      const webhookAvatar = await Bun.file(WEBHOOK_AVATAR_PATH).arrayBuffer();
      const webhook = await notificationsChannel.createWebhook({
        name: 'LiveLaunch Notifications',
        avatar: Buffer.from(webhookAvatar),
      });

      settings.notificationChannelId = notificationsChannel.id;
      settings.notificationWebhookUrl = webhook.url;
      settings.notificationLaunch = 1;
    }

    if (newsChannel) {
      const permissions = newsChannel.permissionsFor(botMember);
      if (
        !permissions?.has(PermissionFlagsBits.ManageWebhooks) ||
        !permissions?.has(PermissionFlagsBits.SendMessages) ||
        !permissions?.has(PermissionFlagsBits.EmbedLinks)
      ) {
        await interaction.editReply(
          `Missing required permissions in ${newsChannel}: Manage Webhooks, Send Messages, and Embed Links are required.`
        );
        return;
      }

      const webhookAvatar = await Bun.file(WEBHOOK_AVATAR_PATH).arrayBuffer();
      const webhook = await newsChannel.createWebhook({
        name: 'LiveLaunch News',
        avatar: Buffer.from(webhookAvatar),
      });

      settings.newsChannelId = newsChannel.id;
      settings.newsWebhookUrl = webhook.url;
    }

    if (messagesChannel) {
      const permissions = messagesChannel.permissionsFor(botMember);
      if (
        !permissions?.has(PermissionFlagsBits.ManageWebhooks) ||
        !permissions?.has(PermissionFlagsBits.SendMessages) ||
        !permissions?.has(PermissionFlagsBits.EmbedLinks)
      ) {
        await interaction.editReply(
          `Missing required permissions in ${messagesChannel}: Manage Webhooks, Send Messages, and Embed Links are required.`
        );
        return;
      }

      const webhookAvatar = await Bun.file(WEBHOOK_AVATAR_PATH).arrayBuffer();
      const webhook = await messagesChannel.createWebhook({
        name: 'LiveLaunch Messages',
        avatar: Buffer.from(webhookAvatar),
      });

      settings.channelId = messagesChannel.id;
      settings.webhookUrl = webhook.url;
    }

    if (eventsCount !== null) {
      const permissions = interaction.guild.members.me?.permissions;
      if (!permissions?.has(PermissionFlagsBits.ManageEvents)) {
        await interaction.editReply('Missing required permission: Manage Events');
        return;
      }

      settings.scheduledEvents = eventsCount;
      settings.seLaunch = 1;
      settings.seEvent = 1;
    }

    await enableGuildFeature(interaction.guildId, settings);

    const enabledFeatures: string[] = [];
    if (notificationsChannel) enabledFeatures.push('notifications');
    if (newsChannel) enabledFeatures.push('news');
    if (messagesChannel) enabledFeatures.push('messages');
    if (eventsCount) enabledFeatures.push(`events (${eventsCount})`);

    await interaction.editReply(
      `✅ LiveLaunch enabled successfully!\n\nEnabled features: ${enabledFeatures.join(', ')}`
    );

    logger.info(`LiveLaunch enabled in guild ${interaction.guildId}`);
  } catch (error) {
    logger.error('Failed to enable LiveLaunch:', error);
    await interaction.editReply('Failed to enable LiveLaunch. Please try again or contact support.');
  }
}

export async function handleDisable(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guildId) {
    await interaction.editReply('This command can only be used in a server.');
    return;
  }

  try {
    await disableGuildFeature(interaction.guildId);
    await interaction.editReply('✅ LiveLaunch has been disabled in this server.');
    logger.info(`LiveLaunch disabled in guild ${interaction.guildId}`);
  } catch (error) {
    logger.error('Failed to disable LiveLaunch:', error);
    await interaction.editReply('Failed to disable LiveLaunch. Please try again or contact support.');
  }
}

export async function handleSettings(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guildId) {
    await interaction.editReply('This command can only be used in a server.');
    return;
  }

  try {
    const settings = await getEnabledGuild(interaction.guildId);

    if (!settings) {
      await interaction.editReply('LiveLaunch is not enabled in this server. Use `/enable` to get started.');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('LiveLaunch Settings')
      .setColor(0x00ff00)
      .setTimestamp();

    const fields: { name: string; value: string; inline?: boolean }[] = [];

    if (settings.channelId) {
      fields.push({ name: 'Messages Channel', value: `<#${settings.channelId}>`, inline: true });
    }

    if (settings.newsChannelId) {
      fields.push({ name: 'News Channel', value: `<#${settings.newsChannelId}>`, inline: true });
    }

    if (settings.notificationChannelId) {
      fields.push({
        name: 'Notifications Channel',
        value: `<#${settings.notificationChannelId}>`,
        inline: true,
      });
    }

    if (settings.scheduledEvents) {
      fields.push({ name: 'Scheduled Events', value: `${settings.scheduledEvents}`, inline: true });
    }

    if (fields.length === 0) {
      fields.push({ name: 'Status', value: 'No features currently enabled' });
    }

    embed.addFields(fields);

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error('Failed to fetch settings:', error);
    await interaction.editReply('Failed to fetch settings. Please try again or contact support.');
  }
}
