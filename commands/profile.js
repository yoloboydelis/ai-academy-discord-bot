// PROGRESS TRACKING automation — /profile slash command.
// Shows the member's XP, current level role, and daily streak.

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadDB, getUser } = require('../db');
const { ROLES } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('profile')
      .setDescription('Show your AI Improvement Academy progress (XP, level, streak)'),
    async execute(interaction) {
          const db = loadDB();
          const user = getUser(db, interaction.user.id);

      const member = interaction.member;
          const levelRole = member.roles.cache.find(r => ROLES.LEVELS.includes(r.name));

      const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Progress`)
            .addFields(
              { name: 'Current level', value: levelRole ? levelRole.name : 'Unverified — take /placement-quiz', inline: true },
              { name: 'XP', value: String(user.xp), inline: true },
              { name: 'Daily streak', value: `${user.streak.count} day(s)`, inline: true }
                    )
            .setColor(0x5865F2);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
