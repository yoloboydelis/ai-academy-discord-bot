// PATH-SELECTION automation (#choose-your-path, decided 2026-06-20 — see
// 02_DISCORD_STRUCTURE.md Section 4.3 and 26_DECISION_LOG.md).
// Scoped only to the #choose-your-path channel. Two reactions, two pre-existing roles:
//   🟢 -> Member     (general Kaizen community access — old/legacy sections)
//   🎓 -> AI-ACADEMY (join the Academy learning track — already gates #placement-quiz
//                     and #beginner-help)
// AI ACADEMY+ is explicitly NOT granted here — that's a future paid tier, not built yet.

const { ROLES, CHANNELS } = require('../config');

module.exports = async function handlePathSelect(reaction, user) {
      try {
                if (user.bot) return;

          // Reactions can arrive as partials — fetch full data before reading properties.
          if (reaction.partial) {
                        await reaction.fetch().catch(() => null);
          }
                if (reaction.message.partial) {
                              await reaction.message.fetch().catch(() => null);
                }

          const channel = reaction.message.channel;
                if (!channel || !channel.name || !channel.name.includes(CHANNELS.CHOOSE_YOUR_PATH)) return;

          const emojiName = reaction.emoji.name;
                if (emojiName !== '🟢' && emojiName !== '🎓') return;

          const guild = reaction.message.guild;
                if (!guild) return;
                const member = await guild.members.fetch(user.id).catch(() => null);
                if (!member) return;

          if (emojiName === '🟢') {
                        const memberRole = guild.roles.cache.find(r => r.name === ROLES.MEMBER);
                        if (memberRole) {
                                          await member.roles.add(memberRole).catch((e) => console.error('[pathSelect] could not add Member role:', e.message));
                        } else {
                                          console.warn('[pathSelect] Member role not found in guild — check it still exists');
                        }
          } else if (emojiName === '🎓') {
                        const academyRole = guild.roles.cache.find(r => r.name === ROLES.AI_ACADEMY);
                        if (academyRole) {
                                          await member.roles.add(academyRole).catch((e) => console.error('[pathSelect] could not add AI-ACADEMY role:', e.message));
                        } else {
                                          console.warn('[pathSelect] AI-ACADEMY role not found in guild — check it still exists');
                        }
          }
      } catch (err) {
                console.error('[pathSelect] error:', err);
      }
};
