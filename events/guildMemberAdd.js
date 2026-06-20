// ONBOARDING automation.
// Fires on Discord's `guildMemberAdd` Gateway event when a new member joins.
// 1. Assigns the `Unverified` role (removed later by the placement quiz, on completion).
// 2. DMs a welcome message pointing them at #placement-quiz.
// 3. If DMs are closed, falls back to a public ping in #placement-quiz instead.

const { EmbedBuilder } = require('discord.js');
const { ROLES, CHANNELS } = require('../config');

module.exports = async function handleGuildMemberAdd(member) {
    try {
          const unverifiedRole = member.guild.roles.cache.find(r => r.name === ROLES.UNVERIFIED);
          if (unverifiedRole) {
                  await member.roles.add(unverifiedRole).catch((e) => console.error('[guildMemberAdd] could not add Unverified role:', e.message));
          } else {
                  console.warn('[guildMemberAdd] Unverified role not found in guild — check it still exists');
          }

      const quizChannel = member.guild.channels.cache.find(c => c.name === CHANNELS.PLACEMENT_QUIZ);

      const embed = new EmbedBuilder()
            .setTitle('Welcome to the AI Improvement Academy! 👋')
            .setDescription(
                      `You're in. Here's how to get started:\n\n` +
                      `1. Head to ${quizChannel ? `#${quizChannel.name}` : '#placement-quiz'} and run **/placement-quiz** — a quick 5-question check that places you at the right starting level.\n` +
                      `2. Once you finish it, your starting level role unlocks and you'll see the right channels.\n` +
                      `3. Got questions along the way? Post in #beginner-help — the bot will try to point you to the right lesson automatically.\n\n` +
                      `No rush. Go at your own pace.`
                    )
            .setColor(0x57F287);

      await member.send({ embeds: [embed] }).catch(async () => {
              if (quizChannel) {
                        await quizChannel.send(`Welcome <@${member.id}>! Your DMs are closed so posting here instead — run **/placement-quiz** to get started.`).catch(() => {});
              }
      });
    } catch (err) {
          console.error('[guildMemberAdd] error:', err);
    }
};
