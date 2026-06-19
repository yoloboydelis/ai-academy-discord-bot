// Minimal JSON-file-backed store. No external DB dependency — keeps hosting simple
// (works on Railway/Render/a bare VPS with zero extra setup). Fine for a single-bot,
// friends-only-phase community; revisit if member count grows into the thousands.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'store.json');

function loadDB() {
    if (!fs.existsSync(DB_PATH)) {
          const initial = { users: {} };
          fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
          return initial;
    }
    try {
          return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (err) {
          console.error('[db] store.json was unreadable, reinitializing:', err);
          const initial = { users: {} };
          fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
          return initial;
    }
}

function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getUser(db, userId) {
    if (!db.users[userId]) {
          db.users[userId] = {
                  xp: 0,
                  lastXpAt: {},                              // channelId -> epoch ms, for cooldown
                  streak: { count: 0, lastDay: null },       // lastDay: 'YYYY-MM-DD' (UTC)
                  quiz: { completed: false, score: null }
          };
    }
    return db.users[userId];
}

module.exports = { loadDB, saveDB, getUser, DB_PATH };
