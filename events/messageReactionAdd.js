// ROLE ASSIGNMENT automation.
// Fires on `messageReactionAdd`. When a MOD/Admin reacts with ✅ on a message
// posted inside a Level forum (channel name starts with "level-", or the message's
// parent forum channel does, since forum posts are threads), the bot treats it as
// graduation approval (per 32_ROLE_GATING_DESIGN.md / Action Ledger B2: moderator
// manually verifies the deliverable, bot just executes the role change).
// Cumulative role design (D13): old level roles are NOT removed, only the next one added.

const { ROLES, CHANNELS, GRADUATION_CHANNEL_PREFIX } = require('../config');

function isMod(member) {
    return member.roles.cache.some(r => ROLES.MOD_ROLES.includes(r.name));
}

function isGraduationChannel(channel) {
    const name = channel.name || '';
    if (name.startsWith(GRADUATION_CHANNEL_PREFIX)) return true;
    const parentName = channel.parent && channel.parent.name;
    if (parentName && parentName.startsWith(GRADUATION_CHANNEL_PREFIX)) return true;
    return false;
}

module.exports = async function handleReactionAdd(reaction, user) {
    try {
          if (reaction.emoji.name !== '✅') return;
          if (user.bot) return;

      if (reaction.partial) await reaction.fetch();
          const message = reaction.message;
          if (message.partial) await message.fetch();

      const guild = message.guild;
          if (!guild) return;
          if (!isGraduationChannel(message.channel)) return;

      const reactingMember = await guild.members.fetch(user.id).catch(() => null);
          if (!reactingMember || !isMod(reactingMember)) return;

      const targetMember = await guild.members.fetch(message.author.id).catch(() => null);
          if (!targetMember || targetMember.user.bot) return;

      const levels = ROLES.LEVELS;
          const currentLevelRole = targetMember.roles.cache.find(r => levels.includes(r.name));
          const currentIndex = currentLevelRole ? levels.indexOf(currentLevelRole.name) : -1;
          const nextIndex = currentIndex + 1;

      if (nextIndex >= levels.length) {
              await message.channel.send(`${targetMember} is already at the top level (${levels[levels.length - 1]}) — nothing to graduate to.`).catch(() => {});
              return;
      }

      const nextRoleName = levels[nextIndex];
          const nextRole = guild.roles.cache.find(r => r.name === nextRoleName);
          if (!nextRole) {
                  console.error(`[messageReactionAdd] role "${nextRoleName}" not found in guild — was it renamed?`);
                  return;
          }

      const unverifiedRole = guild.roles.cache.find(r => r.name === ROLES.UNVERIFIED);
          if (unverifiedRole && targetMember.roles.cache.has(unverifiedRole.id)) {
                  await targetMember.roles.remove(unverifiedRole).catch(() => {});
          }

      await targetMember.roles.add(nextRole).catch((e) => console.error('[messageReactionAdd] add role failed:', e.message));

      await message.reply(`🎉 ${targetMember} graduated to **${nextRoleName}**! Approved by ${reactingMember}.`).catch(() => {});

      const logChannel = guild.channels.cache.find(c => c.name === CHANNELS.BOT_LOGS);
          if (logChannel) {
                  logChannel.send(`[role-assignment] ${targetMember.user.tag} → ${nextRoleName} (approved by ${reactingMember.user.tag})`).catch(() => {});
          }
    } catch (err) {
          console.error('[messageReactionAdd] error:', err);
    }
};
