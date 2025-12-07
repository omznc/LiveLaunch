# LiveLaunch

Creates space related events and sends live streams!

[Add to Server](https://discord.com/api/oauth2/authorize?client_id=869969874036867082&permissions=17601312868352&scope=bot%20applications.commands)

## Features

The events are created from Launch Library 2 launch and event data. Events are automatically maintained by the bot by updating information, starting the event when the livestream goes live, and ending it when the launch is a success or fails.

The messages are YouTube livestreams using webhooks so it looks like the actual YouTube channel sent them.

The news articles are queried from the Spaceflight News API. The articles can be filtered by their respective news sites per guild.

Notifications can be set up to send custom countdowns or changes to launch statuses (liftoff, hold, success/failure/partial failure). Discord events can be included within the countdown notifications.

## Options

- Create events with a maximum of 50 using the events option
- Send YouTube livestreams of launches and events to a channel using the messages option
- Send space-related news articles and filter them by their respective news site
- Receive notifications for countdowns, T-0 changes, and/or launch status changes

LiveLaunch can be enabled and disabled using slash commands.

## Tech Stack

This is a complete TypeScript rewrite of LiveLaunch using modern technologies:

- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript/TypeScript runtime
- **Language**: TypeScript
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **Discord API**: [discord.js](https://discord.js.org) v14
- **HTTP Client**: [axios](https://axios-http.com)
- **HTML Parser**: [node-html-parser](https://github.com/taoqf/node-html-parser)

## Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL >= 14
- Discord Bot Token
- (Optional) Launch Library 2 API Token

### Installation

1. Clone the repository:
```bash
git clone https://github.com/juststephen/LiveLaunch.git
cd LiveLaunch
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file:
```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
DATABASE_URL=postgresql://user:password@localhost:5432/livelaunch
LL2_TOKEN=your_launch_library_2_token (optional)
LOG_LEVEL=info
```

4. Push the database schema:
```bash
bun run db:push
```

5. Start the bot:
```bash
bun run start
```

## Development

### Commands

- `bun run dev` - Start the bot with hot reload
- `bun run build` - Build for production
- `bun run start` - Run the bot
- `bun run typecheck` - Type check the code
- `bun run lint` - Lint the code
- `bun run db:push` - Push schema changes to database
- `bun run db:migrate` - Run database migrations
- `bun run db:generate` - Generate migration files
- `bun run db:studio` - Open Drizzle Studio

### Docker

Run with Docker Compose:

```bash
docker-compose up -d
```

This will start both PostgreSQL and the LiveLaunch bot.

## Project Structure

```
src/
├── main.ts                 # Bot entry point and event handlers
├── db/
│   ├── client.ts          # Database connection
│   ├── queries.ts         # Database query functions
│   ├── schema.ts          # Drizzle schema definitions
│   └── migrations/        # Generated migration files
├── services/
│   ├── launchLibrary2.ts  # Launch Library 2 API client
│   ├── spaceflightNews.ts # Spaceflight News API client
│   └── youtube.ts         # YouTube and NASA TV services
├── commands/
│   ├── index.ts           # Command definitions
│   └── handlers.ts        # Command handler implementations
└── utils/
    ├── helpers.ts         # Utility functions
    └── logger.ts          # Logging utility
```

## Migration from Python Version

This repository contains both the original Python version and the new TypeScript version. The Python files are kept for reference but are no longer maintained. All new development happens in the TypeScript version.

Key changes:
- MySQL → PostgreSQL
- aiomysql → Drizzle ORM
- discord.py → discord.js
- Python async → TypeScript async/await
- pip → bun

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, please open an issue on GitHub or join our Discord server.
