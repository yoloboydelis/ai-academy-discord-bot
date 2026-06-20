// PROGRESS TRACKING + RESOURCE RECOMMENDATION automations.
// Fires on every `messageCreate` Gateway event.
// - awardXP(): +XP and daily-streak increment for activity in tracked channels (cooldown-guarded).
// - resource match: in #beginner-help only, keyword-matches the message against data/resources.json
//   and auto-replies with the most relevant lesson if one is found.

const fs = require('fs');
const path = require('path');
const { XP, CHANNELS } = require('../config');
const { loadDB, saveDB, getUser } = require('../db');

const resources = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'resources.json'), 'utf8'));

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function isTrackedChannel(channelName) {
    return XP.TRACKED_CHANNEL_PREFIXES.some(prefix => channelName === prefix || channelName.startsWith(prefix));
}

function awardXP(message) {
    const channelName = message.channel.name || '';
    if (!isTrackedChannel(channelName)) return;

  const db = loadDB();
    const user = getUser(db, message.author.id);
    const now = Date.now();
    const last = user.lastXpAt[message.channel.id] || 0;

  if (now - last < XP.COOLDOWN_MS) return;

  user.lastXpAt[message.channel.id] = now;
    user.xp += XP.PER_MESSAGE;

  const today = todayKey();
    if (user.streak.lastDay !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          user.streak.count = (user.streak.lastDay === yesterday) ? user.streak.count + 1 : 1;
          user.streak.lastDay = today;
    }

  saveDB(db);
}

function findResourceMatch(content) {
    const lower = content.toLowerCase();
    for (const entry of resources) {
          if (entry.keywords.some(k => lower.includes(k))) return entry;
    }
    return null;
}

module.exports = async function handleMessageCreate(message) {
    try {
          if (message.author.bot || !message.guild) return;

      awardXP(message);

      if (message.channel.name === CHANNELS.BEGINNER_HELP) {
              const match = findResourceMatch(message.content);
              if (match) {
                        await message.reply(
                                    `This might help: **${match.title}** — check #${match.channel}. (Auto-suggested — feel free to ignore if it's not relevant!)`
                                  ).catch(() => {});
              }
      }
    } catch (err) {
          console.error('[messageCreate] error:', err);
    }
};
