// Entry point. Run with `npm start` (after `npm install` and `npm run deploy-commands`).
// Requires DISCORD_BOT_TOKEN in a .env file (see .env.example) and the bot invited to the
// Kaizen guild with the intents listed below enabled in the Developer Portal.

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const client = new Client({
    intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,          // required for guildMemberAdd (Onboarding)
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,        // required to read message text (Resource recommendation)
          GatewayIntentBits.GuildMessageReactions  // required for messageReactionAdd (Role assignment)
        ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember]
});

client.commands = new Collection();
const profileCommand = require('./commands/profile');
const placementQuizCommand = require('./commands/placementQuiz');
client.commands.set(profileCommand.data.name, profileCommand);
client.commands.set(placementQuizCommand.data.name, placementQuizCommand);

const handleGuildMemberAdd = require('./events/guildMemberAdd');
const handleMessageCreate = require('./events/messageCreate');
const handleReactionAdd = require('./events/messageReactionAdd');
const handleInteractionCreate = require('./events/interactionCreate');

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}. Serving ${client.guilds.cache.size} guild(s).`);
});

client.on('guildMemberAdd', handleGuildMemberAdd);
client.on('messageCreate', handleMessageCreate);
client.on('messageReactionAdd', (reaction, user) => handleReactionAdd(reaction, user));
client.on('interactionCreate', (interaction) => handleInteractionCreate(interaction, client));

client.on('error', (err) => console.error('[client error]', err));
process.on('unhandledRejection', (err) => console.error('[unhandled rejection]', err));

client.login(process.env.DISCORD_BOT_TOKEN);
