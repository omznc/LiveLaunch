# Pull Request Information

## PR Title
Rewrite LiveLaunch bot in TypeScript with Bun, PostgreSQL, Drizzle, and discord.js

## PR URL
https://github.com/omznc/LiveLaunch/pull/new/refactor-ts-bun-postgres-drizzle-discordjs-open-pr

## Summary

This PR is a complete rewrite of the LiveLaunch Discord bot from Python to TypeScript using modern technologies and best practices.

## Tech Stack Changes

### Before (Python)
- Runtime: Python 3.12
- Database: MySQL with aiomysql
- Discord API: discord.py
- Async: asyncio

### After (TypeScript)
- Runtime: **Bun** (fast JavaScript/TypeScript runtime)
- Database: **PostgreSQL** with **Drizzle ORM**
- Discord API: **discord.js v14**
- Language: **TypeScript** with strict type checking
- HTTP Client: axios
- HTML Parser: node-html-parser

## Key Features

✅ Complete feature parity with the Python version
✅ Type-safe database queries with Drizzle ORM
✅ Modern slash commands with discord.js v14
✅ Improved error handling and logging
✅ Docker Compose setup with PostgreSQL
✅ Hot reload support for development
✅ Comprehensive TypeScript configuration
✅ ESLint for code quality

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

## Database Schema

All tables have been migrated from MySQL to PostgreSQL:
- `guilds` - Discord guild IDs
- `enabled_guilds` - Guild-specific settings
- `ll2_agencies` - Space agency information
- `ll2_agencies_filter` - Agency filters per guild
- `ll2_events` - Launch and event data
- `news_sites` - News source information
- `news_filter` - News site filters per guild
- `notification_countdown` - Custom countdown minutes
- `scheduled_events` - Discord scheduled event mappings
- `sent_news` - Tracking sent news articles
- `sent_streams` - Tracking sent livestreams

## Development Commands

```bash
bun install              # Install dependencies
bun run dev              # Start with hot reload
bun run build            # Build for production
bun run start            # Run the bot
bun run typecheck        # Type check with TypeScript
bun run lint             # Run ESLint
bun run db:push          # Push schema to database
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio
```

## Docker

The Docker setup has been updated to support the new stack:
- Uses `oven/bun:latest` base image
- Includes PostgreSQL 16 service
- Health checks and proper dependencies
- Volume for persistent data

## Migration Notes

The old Python files remain in the repository for reference but are superseded by this TypeScript implementation. Future development will focus on the TypeScript version.

## Testing

- ✅ TypeScript compilation passes
- ✅ ESLint passes with no warnings
- ✅ All database schemas defined
- ✅ Discord command registration works
- ✅ API service clients implemented

## Breaking Changes

⚠️ **Important**: This requires a fresh database setup as we're moving from MySQL to PostgreSQL. Existing data will need to be migrated manually if required.

## Environment Variables

New required variables:
```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
DATABASE_URL=postgresql://user:password@localhost:5432/livelaunch
LL2_TOKEN=your_launch_library_2_token (optional)
LOG_LEVEL=info
```

See `.env.example` for a template.

## Next Steps

After this PR is merged:
1. Set up PostgreSQL database
2. Run database migrations
3. Update environment variables
4. Deploy the new version
5. Monitor for any issues

## Related

This addresses the need for modernization and better maintainability of the codebase while adding the benefits of static typing and a more robust ecosystem.
