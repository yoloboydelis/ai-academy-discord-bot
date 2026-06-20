# AI Improvement Academy — Discord Bot

Implements the 5 event-driven automations that Cowork's scheduled-task model
can't do (event listening, not cron/time-based) — see the project's
`38_DISCORD_BOT.md` for full background:

- **Onboarding** — DMs new members + assigns the `Unverified` role on join
- - **Skill assessment** — `/placement-quiz` slash command, 5-question quiz, assigns starting `LvlN` role
  - - **Role assignment** — a MOD/Admin ✅-reacts on a member's message in a Level forum → bumps them to the next `LvlN` role
    - - **Progress tracking** — XP + daily streak per tracked-channel message (cooldown-guarded), `/profile` command
      - - **Resource recommendation** — keyword-matches questions in `#beginner-help` against `data/resources.json`, auto-replies with the relevant lesson
       
        - This bot needs its own Discord application/token and 24/7 hosting outside
        - Cowork — it cannot run from inside this sandbox. See `SETUP.md` for full
        - deployment instructions.
       
        - ## Quick start (once you have a bot token)
       
        - ```
          npm install
          cp .env.example .env   # fill in DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID
          npm run deploy-commands
          npm start
          ```

          ## Files

          ```
          index.js                 entry point — client setup, event wiring
          deploy-commands.js        registers /profile and /placement-quiz with Discord
          config.js                 role/channel names + tunables (XP rate, cooldown, mod role names)
          db.js                     minimal JSON-file-backed store (data/store.json, auto-created)
          events/
            guildMemberAdd.js        Onboarding
            messageCreate.js         Progress tracking + Resource recommendation
            messageReactionAdd.js    Role assignment
            interactionCreate.js     routes slash commands + placement-quiz button clicks
          commands/
            profile.js               /profile
            placementQuiz.js         /placement-quiz
          data/
            resources.json           keyword → lesson mapping for #beginner-help auto-replies
            quiz-questions.json      placement quiz questions + scoring tiers
          ```

          ## Notes

          - All role/channel lookups are by **name**, not hardcoded ID, so the bot keeps
          -   working if the server is ever recreated.
          -   - `data/store.json` is created automatically on first run and gitignored —
              -   back it up before redeploying if you care about keeping XP/streak history.
              -   - Cumulative role design: graduating doesn't remove earlier `LvlN` roles (matches
                  -   the project's D13 decision).
