// Central constants — live Discord role/channel names this bot looks up by NAME at
// runtime (never hardcoded IDs), so it keeps working if the server is ever recreated
// or roles are re-ordered. Confirmed live in the Kaizen group server as of 2026-06-19.

module.exports = {
        ROLES: {
                    UNVERIFIED: 'Unverified',
                    // Cumulative, in ascending order — index N = level N (per 32_ROLE_GATING_DESIGN.md, D12/D13)
                    LEVELS: ['Lvl0', 'Lvl1', 'Lvl2', 'Lvl3', 'Lvl4', 'Lvl5', 'Lvl6', 'Lvl7', 'Lvl8'],
                    // Role names trusted to approve graduations instantly (moderator fast-path).
                    // Matches live role names "MOD" and "Admin roll".
                    MOD_ROLES: ['MOD', 'Admin roll']
        },
        CHANNELS: {
                    PLACEMENT_QUIZ: 'placement-quiz',
                    BEGINNER_HELP: 'beginner-help',
                    BOT_LOGS: 'bot-logs'
        },
        XP: {
                    PER_MESSAGE: 10,
                    COOLDOWN_MS: 60 * 1000, // per user, per channel — prevents XP farming via spam
                    // A channel counts toward XP/streak if its name matches one of these prefixes/exact names
                    TRACKED_CHANNEL_PREFIXES: ['level-', 'beginner-help', 'placement-quiz', 'daily-challenge', 'challenge-submissions']
        },
        // Graduation (Role assignment automation) only fires on messages inside a Level forum
        // (channel name starts with this, or the message's parent forum channel does — forum
        // posts are threads, so the prefix usually lives on the parent, not the thread itself).
        GRADUATION_CHANNEL_PREFIX: 'level-',
        // Peer-approval graduation (40_GRADUATION_SYSTEM_DESIGN.md, Option A, decided 2026-06-20):
        // removes the moderator bottleneck — N distinct members holding a HIGHER LvlN role than
        // the post author can promote them, with no MOD/Admin involved. The MOD/Admin fast-path
        // below still exists too, for cases where a moderator wants to fast-track one immediately.
        GRADUATION: {
                    PEER_APPROVALS_REQUIRED: 3
        }
};
