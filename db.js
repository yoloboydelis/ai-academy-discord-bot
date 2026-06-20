// Minimal JSON-file persistence — no external DB needed at this server's size.
// Replace with a real database if member count grows into the thousands.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'store.json');

function loadDB() {
        if (!fs.existsSync(DB_PATH)) {
                    const initial = { users: {}, graduationApprovals: {} };
                    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
                    return initial;
        }
        try {
                    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
                    if (!data.graduationApprovals) data.graduationApprovals = {};
                    return data;
        } catch (err) {
                    console.error('[db] store.json was unreadable, reinitializing:', err);
                    const initial = { users: {}, graduationApprovals: {} };
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
                                    lastXpAt: {},
                                    streak: { count: 0, lastDay: null },
                                    quiz: { completed: false, score: null }
                    };
        }
        return db.users[userId];
}

// Peer-approval graduation tracking (40_GRADUATION_SYSTEM_DESIGN.md, Option A).
// Keyed by Discord message ID -> array of distinct reactor user IDs who have
// qualified as an approver for that message (eligibility is checked by the caller
// before calling addGraduationApproval).

function getGraduationApprovals(db, messageId) {
        if (!db.graduationApprovals) db.graduationApprovals = {};
        if (!db.graduationApprovals[messageId]) db.graduationApprovals[messageId] = [];
        return db.graduationApprovals[messageId];
}

function addGraduationApproval(db, messageId, userId) {
        const approvals = getGraduationApprovals(db, messageId);
        if (!approvals.includes(userId)) approvals.push(userId);
        return approvals;
}

function clearGraduationApprovals(db, messageId) {
        if (db.graduationApprovals) delete db.graduationApprovals[messageId];
}

module.exports = {
        loadDB,
        saveDB,
        getUser,
        getGraduationApprovals,
        addGraduationApproval,
        clearGraduationApprovals,
        DB_PATH
};
