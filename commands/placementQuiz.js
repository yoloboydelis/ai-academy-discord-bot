// SKILL ASSESSMENT automation — /placement-quiz slash command.
// Presents a 6-question multiple-choice quiz via buttons (handled onward in
// events/interactionCreate.js), scores it, and assigns a starting Lvl role.

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const quizData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'quiz-questions.json'), 'utf8'));

module.exports = {
      data: new SlashCommandBuilder()
        .setName('placement-quiz')
        .setDescription('Take the 6-question placement quiz to get your starting level'),
      async execute(interaction) {
              const q = quizData.questions[0];
              const row = new ActionRowBuilder().addComponents(
                        q.options.map((opt, i) =>
                                    new ButtonBuilder()
                                                .setCustomId(`quiz_0_${i}_0`)
                                                .setLabel(opt.slice(0, 80))
                                                .setStyle(ButtonStyle.Secondary)
                                            )
                      );
              const embed = new EmbedBuilder()
                .setTitle(`Placement Quiz — Question 1/${quizData.questions.length}`)
                .setDescription(q.q)
                .setColor(0xFEE75C);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }
};
