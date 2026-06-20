// Routes Gateway `interactionCreate` events: slash commands (registered in client.commands)
// and the placement-quiz's button clicks (SKILL ASSESSMENT automation).

const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { ROLES } = require('../config');
const { loadDB, saveDB, getUser } = require('../db');

const quizData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'quiz-questions.json'), 'utf8'));

module.exports = async function handleInteractionCreate(interaction, client) {
        try {
                      if (interaction.isChatInputCommand()) {
                                            const command = client.commands.get(interaction.commandName);
                                            if (!command) return;
                                            await command.execute(interaction);
                                            return;
                      }

          if (interaction.isButton() && interaction.customId.startsWith('quiz_')) {
                            await handleQuizButton(interaction);
          }
        } catch (err) {
                      console.error('[interactionCreate] error:', err);
        }
};

async function handleQuizButton(interaction) {
        // customId shape: quiz_<questionIndex>_<optionIndex>_<correctCountSoFar>
  const [, qIndexStr, optIndexStr, correctStr] = interaction.customId.split('_');
        const qIndex = parseInt(qIndexStr, 10);
        const optIndex = parseInt(optIndexStr, 10);
        const correctSoFar = parseInt(correctStr, 10);

  const { questions, scoring } = quizData;
        const wasCorrect = questions[qIndex].correctIndex === optIndex;
        const newCorrect = correctSoFar + (wasCorrect ? 1 : 0);
        const nextIndex = qIndex + 1;

  if (nextIndex < questions.length) {
              const q = questions[nextIndex];
              const row = new ActionRowBuilder().addComponents(
                                  q.options.map((opt, i) =>
                                                                new ButtonBuilder()
                                                                                        .setCustomId(`quiz_${nextIndex}_${i}_${newCorrect}`)
                                                                                        .setLabel(opt.slice(0, 80))
                                                                                        .setStyle(ButtonStyle.Secondary)
                                                                                    )
                                );
              const embed = new EmbedBuilder()
                .setTitle(`Placement Quiz — Question ${nextIndex + 1}/${questions.length}`)
                .setDescription(q.q)
                .setColor(0xFEE75C);
              await interaction.update({ embeds: [embed], components: [row] });
              return;
  }

  // Quiz finished — determine tier (tiers ordered highest minCorrect first) and assign level
  const tier = scoring.tiers.find(t => newCorrect >= t.minCorrect);
        const assignLevel = tier ? tier.assignLevel : scoring.tiers[scoring.tiers.length - 1].assignLevel;

  const guild = interaction.guild;
        const member = interaction.member;

  const unverifiedRole = guild.roles.cache.find(r => r.name === ROLES.UNVERIFIED);
        if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
                      await member.roles.remove(unverifiedRole).catch(() => {});
        }
        const levelRole = guild.roles.cache.find(r => r.name === assignLevel);
        if (levelRole) {
                      await member.roles.add(levelRole).catch((e) => console.error('[quiz] could not add level role:', e.message));
        } else {
                      console.error(`[quiz] role "${assignLevel}" not found in guild`);
        }

  const db = loadDB();
        const userRec = getUser(db, member.id);
        userRec.quiz = { completed: true, score: newCorrect };
        saveDB(db);

  const levelChannelMap = { Lvl0: 'level-0-fundamentals', Lvl1: 'level-1-prompting-basics', Lvl2: 'level-2-advanced-prompting', Lvl3: 'level-3-ai-workflows' };
        const destChannel = levelChannelMap[assignLevel] || 'level-0-fundamentals';

  const resultEmbed = new EmbedBuilder()
          .setTitle('Placement Quiz Complete! 🎉')
          .setDescription(
                            `You scored **${newCorrect}/${questions.length}**.\n\n` +
                            `Starting level: **${assignLevel}**\n` +
                            `Head to #${destChannel} to begin.`
                          )
          .setColor(0x57F287);

  await interaction.update({ embeds: [resultEmbed], components: [] });
}
