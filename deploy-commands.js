// Registers the slash commands (/profile, /placement-quiz) with Discord for the guild
// in DISCORD_GUILD_ID. Run once after first setting up the bot, and again any time a
// command's definition changes. Guild-scoped commands (not global) so they show up
// immediately — no up-to-1-hour global propagation delay.

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const profileCommand = require('./commands/profile');
const placementQuizCommand = require('./commands/placementQuiz');

const commands = [profileCommand.data.toJSON(), placementQuizCommand.data.toJSON()];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
          console.log('Registering slash commands...');
          await rest.put(
                  Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands }
                );
          console.log('Slash commands registered for guild', process.env.DISCORD_GUILD_ID);
    } catch (err) {
          console.error('Failed to register commands:', err);
    }
})();
