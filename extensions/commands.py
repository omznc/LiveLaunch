import aiohttp
from discord import (
    Embed,
    Permissions,
    TextChannel,
    Webhook
)
from discord.errors import Forbidden
from discord.ext import commands
from itertools import compress
import logging

from bin import combine_strings, convert_minutes

class LiveLaunchCommand(commands.Cog):
    """
    Discord.py cog for enabling/disabling LiveLaunch in a Discord channel.
    """
    def __init__(self, bot):
        self.bot = bot
        # Settings
        self.webhook_avatar_path = 'LiveLaunch_Webhook_Avatar.png'

    @commands.command()
    @commands.has_guild_permissions(administrator=True)
    @commands.bot_has_guild_permissions(
        manage_webhooks=True,
        manage_events=True,
        send_messages=True,
        embed_links=True
    )
    @commands.cooldown(1, 16)
    @commands.defer(ephemeral=True)
    async def enable(
        self,
        ctx,
        notifications: TextChannel = None,
        news: TextChannel = None,
        messages: TextChannel = None,
        events: int = None
    ) -> None:
        """
        Enable LiveLaunch features, only for administrators.

        Parameters
        ----------
        notifications : discord.TextChannel, default: None
            Discord channel to send
            notifications to.
        news : discord.TextChannel, default: None
            Discord channel to send news to.
        messages : discord.TextChannel, default: None
            Discord channel to send streams to.
        events : int, default: None
            Maximum amount of events to create if
            given, between 1 and 50.
        """
        async def create_webhook(channel: TextChannel, *, feature: str) -> None:
            """
            Create a webhook for the given channel.

            Parameters
            ----------
            channel : TextChannel
                Text channel to
                add webhook in.
            feature : str
                Feature to mention
                when it fails.
            """
            # Read image for the avatar
            webhook_avatar = open(self.webhook_avatar_path, 'rb').read()
            # Try creating the webhook, otherwise send fail message and stop
            try:
                url = (await channel.create_webhook(
                    name=f'LiveLaunch {feature}',
                    avatar=webhook_avatar
                )).url
            except Forbidden:
                await ctx.send(
                    'LiveLaunch requires the `Manage Webhooks`, '
                    '`Send Messages` and `Embed Links` permissions for '
                    'the `messages` feature in the specified channel.'
                )
            except:
                await ctx.send(
                    f'Failed to enable the {feature} feature',
                    ephemeral=True
                )
            else:
                return url

        # Guild ID
        guild_id = ctx.guild.id

        # Check if it is already enabled in the guild
        settings = await self.bot.lldb.enabled_guilds_get(guild_id)

        # Existing entry, editing
        if settings:
            new_settings = {'guild_id': guild_id}

            # Webhook notification settings
            if notifications:
                # Move messages to another channel if there was a previous one
                if settings['notification_channel_id']:

                    # Create webhook for deletion
                    async with aiohttp.ClientSession() as session:
                        webhook = Webhook.from_url(
                            settings['notification_webhook_url'],
                            session=session
                        )
                        # Delete webhook
                        try:
                            await webhook.delete()
                        except:
                            pass

                # Add new data
                notification_webhook_url = await create_webhook(
                    notifications,
                    feature='Notifications'
                )
                if notification_webhook_url is None:
                    return
                else:
                    new_settings['notification_channel_id'] = notifications.id
                    new_settings['notification_webhook_url'] = notification_webhook_url

            # Webhook news settings
            if news:
                # Move messages to another channel if there was a previous one
                if settings['news_channel_id']:

                    # Create webhook for deletion
                    async with aiohttp.ClientSession() as session:
                        webhook = Webhook.from_url(
                            settings['news_webhook_url'],
                            session=session
                        )
                        # Delete webhook
                        try:
                            await webhook.delete()
                        except:
                            pass

                # Add new data
                news_webhook_url = await create_webhook(news, feature='News')
                if news_webhook_url is None:
                    return
                else:
                    new_settings['news_channel_id'] = news.id
                    new_settings['news_webhook_url'] = news_webhook_url

            # Webhook stream settings
            if messages:
                # Move messages to another channel if there was a previous one
                if settings['channel_id']:

                    # Create webhook for deletion
                    async with aiohttp.ClientSession() as session:
                        webhook = Webhook.from_url(
                            settings['webhook_url'],
                            session=session
                        )
                        # Delete webhook
                        try:
                            await webhook.delete()
                        except:
                            pass

                # Add new data
                webhook_url = await create_webhook(messages, feature='Messages')
                if webhook_url is None:
                    return
                else:
                    new_settings['channel_id'] = messages.id
                    new_settings['webhook_url'] = webhook_url

            # Event settings
            if events:
                new_settings['scheduled_events'] = events

            # Existing entry, edit row if anything new is enabled
            if len(new_settings) > 1:
                await self.bot.lldb.enabled_guilds_edit(
                    **new_settings
                )

                # Base message
                message = 'Features updated'
                # Add notification info if needed
                if notifications:
                    message += '\n**For notifications:**\ndon\'t forget ' \
                        'to run the `/notifications` commands to ' \
                        'finish setting up notifications.'
            # Nothing new nabled
            else:
                message = 'No new features enabled, please select at least one.'

            # Notify user
            await ctx.send(
                message,
                ephemeral=True
            )

        # New entry
        else:
            settings = {'guild_id': guild_id}

            # Get channel ID and create a notification webhook if requested
            if notifications:
                notification_webhook_url = await create_webhook(
                    notifications,
                    feature='Notifications'
                )
                if notification_webhook_url is None:
                    return
                else:
                    settings['notification_channel_id'] = notifications.id
                    settings['notification_webhook_url'] = notification_webhook_url

            # Get channel ID and create a news webhook if requested
            if news:
                news_webhook_url = await create_webhook(news, feature='News')
                if news_webhook_url is None:
                    return
                else:
                    settings['news_channel_id'] = news.id
                    settings['news_webhook_url'] = news_webhook_url

            # Get channel ID and create a stream webhook if requested
            if messages:
                webhook_url = await create_webhook(messages, feature='Messages')
                if webhook_url is None:
                    return
                else:
                    settings['channel_id'] = messages.id
                    settings['webhook_url'] = webhook_url

            # Amount of Discord scheduled events if requested
            if events:
                settings['scheduled_events'] = events

            # Add to the database if anything is enabled
            if len(settings) > 1:
                await self.bot.lldb.enabled_guilds_add(
                    **settings
                )

                # Base message
                message = 'Requested features are now enabled'
                # Add notification info if needed
                if notifications:
                    message += '\n**For notifications:**\ndon\'t forget ' \
                        'to run the `/notifications` commands to ' \
                        'finish setting up notifications.'
            # Nothing enabled
            else:
                message = 'No features enabled, please select at least one.'

            # Notify user
            await ctx.send(
                message,
                ephemeral=True
            )

    @commands.command()
    @commands.has_guild_permissions(administrator=True)
    @commands.cooldown(1, 16)
    @commands.defer(ephemeral=True)
    async def disable(self, ctx, features: str) -> None:
        """
        Disable LiveLaunch features, only for administrators.

        Parameters
        ----------
        features : str
            Features to disable,
            - options:
                - ` notifications `:
                    Disable notification sending.
                - ` news `:
                    Disable news sending.
                - ` messages `:
                    Disable stream sending.
                - ` events `:
                    Disable event creation.
                - ` all `:
                    Disable everything.
        """
        # Guild ID
        guild_id = ctx.guild.id

        # Check if anything is enabled
        if not (settings := await self.bot.lldb.enabled_guilds_get(guild_id)):
            await ctx.send(
                'No features are enabled',
                ephemeral=True
            )
            return

        new_settings = {'guild_id': guild_id}

        # Remove webhooks if needed
        for i, key in zip(
            (
                'notifications',
                'news',
                'messages'
            ),
            (
                'notification_',
                'news_',
                ''
            )
        ):
            if features in (i, 'all') and settings[f'{key}webhook_url']:
                # Create webhook for deletion
                async with aiohttp.ClientSession() as session:
                    webhook = Webhook.from_url(
                        settings[f'{key}webhook_url'],
                        session=session
                    )
                    # Delete webhook
                    try:
                        await webhook.delete()
                    except:
                        pass

                new_settings[f'{key}channel_id'] = None
                new_settings[f'{key}webhook_url'] = None

        # Remove the events feature if needed
        if features in ('events', 'all') and settings['scheduled_events']:
            new_settings['scheduled_events'] = 0

        # Remove row from the database
        if all(
            i in new_settings for i in (
                'webhook_url',
                'scheduled_events',
                'news_webhook_url',
                'notification_webhook_url'
            )
        ):
            # Update database
            await self.bot.lldb.enabled_guilds_edit(
                **new_settings
            )
            # Notify user
            await ctx.send(
                'All features are now disabled',
                ephemeral=True
            )
        # Update row, other feature stays enabled
        elif len(new_settings) > 1:
            # Update database
            await self.bot.lldb.enabled_guilds_edit(
                **new_settings
            )
            # Notify user
            await ctx.send(
                'Requested features are now disabled',
                ephemeral=True
            )
        else:
            # Notify user
            await ctx.send(
                'Requested feature is already disabled',
                ephemeral=True
            )

    @commands.command()
    @commands.has_guild_permissions(administrator=True)
    @commands.cooldown(1, 1024)
    @commands.defer(ephemeral=True)
    async def synchronize(self, ctx) -> None:
        """
        Manually synchronize LiveLaunch events, only for administrators.
        """
        # Amount of unsynchronized scheduled events
        amount = 0

        # Guild ID
        guild_id = ctx.guild.id

        # Get guild's Discord scheduled events
        discord_events = await self.bot.http.list_guild_scheduled_events(guild_id)

        # Get a list of the scheduled event IDs only made by the bot itself
        discord_events = [
            int(i['id']) for i in discord_events \
            if int(i['creator_id']) == self.bot.application_id
        ]

        # Get guild's scheduled events cached in the database
        async for scheduled_event_id in self.bot.lldb.scheduled_events_guild_id_iter(guild_id):
            # Check if the event still exists
            if scheduled_event_id not in discord_events:
                # Increment amount
                amount += 1
                # Remove scheduled_event_id from the database
                await self.bot.lldb.scheduled_events_remove(
                    scheduled_event_id
                )

        # Notify user
        await ctx.send(
            f"Synchronized, {amount} event{'s are' if amount != 1 else ' is'} missing.",
            ephemeral=True
        )

    @commands.command()
    @commands.has_guild_permissions(administrator=True)
    @commands.cooldown(1, 16)
    @commands.defer(ephemeral=True)
    async def settings_list(self, ctx) -> None:
        """
        List all LiveLaunch settings within
        this Guild, only for administrators.
        """
        # Guild ID
        guild_id = ctx.guild.id

        # Check if anything is enabled
        if not (settings := await self.bot.lldb.enabled_guilds_get(guild_id)):
            await ctx.send(
                'No features are enabled',
                ephemeral=True
            )
            return

        # Create settings embed
        embed = Embed(
            color=0x00E8FF,
            description='All LiveLaunch settings within this server.',
            title='LiveLaunch Settings'
        )

        # Feature settings
        features = ''
        for key, name in zip(
            (
                'notification_webhook_url',
                'news_webhook_url',
                'webhook_url',
                'scheduled_events'
            ),
            (
                'Notifications',
                'News',
                'Messages',
                'Events'
            )
        ):
            if settings[key]:
                features += '\n:white_check_mark:  ' + name
            else:
                features += '\n:x:  ' + name
        # Add features to embed
        embed.add_field(
            name='Features',
            value=features,
            inline=False
        )

        # Scheduled event settings
        features = ''
        for key, name in zip(
            (
                'se_launch',
                'se_event',
                'se_no_url',
            ),
            (
                'Launch events',
                'Other events',
                'Hide events without a live stream'
            )
        ):
            if settings[key]:
                features += '\n:white_check_mark:  ' + name
            else:
                features += '\n:x:  ' + name
        # Add features to embed
        embed.add_field(
            name='Events',
            value=features,
            inline=False
        )

        # Button settings
        features = ''
        for key, name in zip(
            (
                'notification_button_sln',
                'notification_button_g4l',
                'notification_button_fc'
            ),
            (
                'Include a button to Space Launch Now',
                'Include a button to Go4Liftoff',
                'Include a button to Flight Club'

            )
        ):
            if settings[key]:
                features += '\n:white_check_mark:  ' + name
            else:
                features += '\n:x:  ' + name
        # Add features to embed
        embed.add_field(
            name='Buttons',
            value=features,
            inline=False
        )

        # List agency filters
        filters_guild = await self.bot.lldb.ll2_agencies_filter_list(
            guild_id=guild_id
        )
        # Add enabled filters
        if filters_guild:
            # Format individual filters
            filters_text = [f'{i}) {j}\n' for i, j in filters_guild]
            # Combine them
            filters_text = combine_strings(filters_text)
            # Insert into the embed
            for i, j in enumerate(filters_text):
                embed.add_field(
                    name='Enabled agency filters' + (' (continued)' if i else ''),
                    value=f'```{j}```',
                    inline=False
                )

        # List news filters
        filters_guild = await self.bot.lldb.news_filter_list(
            guild_id=guild_id
        )
        # Add enabled filters
        if filters_guild:
            # Format individual filters
            filters_text = [f'{i}) {j}\n' for i, j in filters_guild]
            # Combine them
            filters_text = combine_strings(filters_text)
            # Insert into the embed
            for i, j in enumerate(filters_text):
                embed.add_field(
                    name='Enabled news filters' + (' (continued)' if i else ''),
                    value=f'```{j}```'
                )

        # Add general notification settings
        features = ''
        for key, name in zip(
            (
                'notification_event',
                'notification_launch',
                'notification_t0_change',
                'notification_scheduled_event'
            ),
            (
                'Events',
                'Launches',
                'T-0 changes',
                'Include Discord scheduled events'
            )
        ):
            if settings[key]:
                features += '\n:white_check_mark:  ' + name
            else:
                features += '\n:x:  ' + name
        # Add features to embed
        embed.add_field(
            name='Notifications: general',
            value=features,
            inline=False
        )

        # Add status notification settings
        features = ''
        for key, name in zip(
            (
                'notification_end_status',
                'notification_hold',
                'notification_liftoff',
                'notification_go',
                'notification_tbc',
                'notification_tbd'
            ),
            (
                'Launch end status',
                'Launch hold',
                'Launch liftoff',
                'Go for launch',
                'Launch to be confirmed',
                'Launch to be determined'
            )
        ):
            if settings[key]:
                features += '\n:white_check_mark:  ' + name
            else:
                features += '\n:x:  ' + name
        # Add features to embed
        embed.add_field(
            name='Notifications: launch status',
            value=features,
            inline=False
        )

        # List countdown settings
        countdown = await self.bot.lldb.notification_countdown_list(ctx.guild.id)
        # Add countdown settings
        if countdown:
            embed.add_field(
                name='Current countdowns',
                value='```' +
                    '\n'.join(convert_minutes(j) for i, j in countdown) +
                    '```',
                inline=False
            )

        # Notify user
        await ctx.send(
            embed=embed,
            ephemeral=True
        )

    @enable.error
    @disable.error
    @synchronize.error
    @settings_list.error
    async def command_error(self, ctx, error) -> None:
        """
        Method that handles erroneous interactions with the commands.
        """
        if isinstance(error, commands.errors.MissingPermissions):
            if ctx.prefix == '/':
                await ctx.send('This command is only for administrators.', ephemeral=True)
        elif isinstance(error, commands.errors.NoPrivateMessage):
            await ctx.send('This command is only for guild channels.')
        elif isinstance(error, commands.errors.CommandOnCooldown):
            await ctx.send(
                f'This command is on cooldown for {error.retry_after:.0f} more seconds.',
                ephemeral=True
            )
        elif isinstance(error, commands.errors.BotMissingPermissions):
            await ctx.send(
                'LiveLaunch requires the `Manage Webhooks`, `Manage Events`, '
                '`Send Messages` and `Embed Links` permissions.'
            )
        else:
            logging.warning(f'Command: {ctx.command}\nError: {error}')
            print(f'Command: {ctx.command}\nError: {error}')


def setup(client):
    client.add_cog(LiveLaunchCommand(client))
