import {
  Client,
  GatewayIntentBits,
  ActivityType,
  Events,
  REST,
  Routes,
  Interaction,
} from 'discord.js';
import { logger } from './utils/logger';
import { commands, handleCommand } from './commands/index';
import { addGuild, removeGuild } from './db/queries';

const TOKEN = process.env.DISCORD_TOKEN as string;
const CLIENT_ID = process.env.CLIENT_ID as string;

if (!TOKEN) {
  logger.error('DISCORD_TOKEN environment variable is not set');
  process.exit(1);
}

if (!CLIENT_ID) {
  logger.error('CLIENT_ID environment variable is not set');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`Logged in as ${readyClient.user.tag}`);
  logger.info(`Connected to ${readyClient.guilds.cache.size} servers`);

  await readyClient.user.setActivity('Kerbal Space Program', {
    type: ActivityType.Playing,
  });

  await registerCommands();
});

client.on(Events.GuildCreate, async (guild) => {
  logger.info(`Joined guild: ${guild.name} (${guild.id})`);
  await addGuild(guild.id);
});

client.on(Events.GuildDelete, async (guild) => {
  logger.info(`Left guild: ${guild.name} (${guild.id})`);
  await removeGuild(guild.id);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await handleCommand(interaction);
  } catch (error) {
    logger.error('Error handling command:', error);
    const replyOptions = {
      content: 'An error occurred while executing this command.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  }
});

client.on(Events.Error, (error) => {
  logger.error('Discord client error:', error);
});

async function registerCommands(): Promise<void> {
  try {
    logger.info('Registering application commands...');

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    logger.info('Successfully registered application commands');
  } catch (error) {
    logger.error('Failed to register application commands:', error);
  }
}

async function main(): Promise<void> {
  try {
    await client.login(TOKEN);
  } catch (error) {
    logger.error('Failed to login:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

main();
