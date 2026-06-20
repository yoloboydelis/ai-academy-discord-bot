// ROLE ASSIGNMENT automation.
// Fires on `messageReactionAdd`. A ✅ reaction on a post inside a Level forum is
// treated as a graduation approval in one of two ways (per 40_GRADUATION_SYSTEM_DESIGN.md,
// "Option A — peer-approval only", decided 2026-06-20 to remove the moderator bottleneck):
//
//   1. MOD/Admin fast-path: a single MOD or Admin roll reaction promotes immediately,
//      same as before — moderators keep the ability to fast-track, they're just no
//      longer required for the normal path.
//   2. Peer-approval path (new): once GRADUATION.PEER_APPROVALS_REQUIRED distinct members
//      who each hold a Level role HIGHER than the post author's current highest level
//      have reacted ✅, the bot promotes automatically — no moderator involved at all.
//
// Cumulative role design (D13): old level roles are NOT removed, only the next one added.

const { ROLES, CHANNELS, GRADUATION_CHANNEL_PREFIX, GRADUATION } = require('../config');
const { loadDB, saveDB, addGraduationApproval, clearGraduationApprovals } = require('../db');

const levels = ROLES.LEVELS;

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

// Cumulative roles mean a member can hold several LvlN roles at once — take the
// highest index actually held, not just whichever one .find() happens to hit first.
function getHighestLevelIndex(member) {
        let highest = -1;
        for (const role of member.roles.cache.values()) {
                    const idx = levels.indexOf(role.name);
                    if (idx > highest) highest = idx;
        }
        return highest;
}

async function promote(message, targetMember, currentIndex, approverLabel) {
        const guild = message.guild;
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

    await message.reply(`🎉 ${targetMember} graduated to **${nextRoleName}**! ${approverLabel}`).catch(() => {});

    const logChannel = guild.channels.cache.find(c => c.name === CHANNELS.BOT_LOGS);
        if (logChannel) {
                    logChannel.send(`[role-assignment] ${targetMember.user.tag} → ${nextRoleName} (${approverLabel})`).catch(() => {});
        }
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
                    if (!reactingMember) return;

            const targetMember = await guild.members.fetch(message.author.id).catch(() => null);
                    if (!targetMember || targetMember.user.bot) return;
                    if (reactingMember.id === targetMember.id) return; // no self-approval

            const currentIndex = getHighestLevelIndex(targetMember);

            // Fast-path: a single MOD/Admin reaction still promotes immediately.
            if (isMod(reactingMember)) {
                            await promote(message, targetMember, currentIndex, `Approved by ${reactingMember.user.tag} (moderator fast-path).`);
                            const cleanupDb = loadDB();
                            clearGraduationApprovals(cleanupDb, message.id);
                            saveDB(cleanupDb);
                            return;
            }

            // Peer-approval path: reactor must hold a strictly higher level than the author.
            const reactorIndex = getHighestLevelIndex(reactingMember);
                    if (reactorIndex <= currentIndex) return; // not eligible to approve this submission

            const db = loadDB();
                    const approvals = addGraduationApproval(db, message.id, reactingMember.id);
                    saveDB(db);

            const required = (GRADUATION && GRADUATION.PEER_APPROVALS_REQUIRED) || 3;
                    if (approvals.length < required) return; // still collecting approvals, stay quiet

            await promote(message, targetMember, currentIndex, `Peer-approved by ${approvals.length} higher-level members.`);
                    clearGraduationApprovals(db, message.id);
                    saveDB(db);
        } catch (err) {
                    console.error('[messageReactionAdd] error:', err);
        }
};
