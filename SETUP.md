# Setup & Deployment — AI Improvement Academy Discord Bot

This bot makes 5 of the Academy's automations event-driven and hands-off
(Onboarding, Skill assessment, Role assignment, Progress tracking, Resource
recommendation). It cannot be created, hosted, or run from inside Cowork —
Claude can write and verify the code, but creating a Discord application/bot
token and running it 24/7 are steps **you (Delis) have to do yourself**. This
file is the complete walkthrough.

Everything below has already been done for you by Claude: the code is
written, syntax-checked, and its modules load without errors (verified
2026-06-19). What's left is entirely steps 1–5 below, on your own machine/account.

---

## What you'll need

- A Discord account with permission to manage the Kaizen group server (you already have this)
- - 10–15 minutes for steps 1–3
  - - A place to run Node.js 24/7 for step 5 (a few free/cheap options listed below)
   
    - ---

    ## Step 1 — Create the Discord application + bot

    1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and log in.
    2. 2. Click **New Application**, name it (e.g. "AI Academy Bot"), accept the terms, click **Create**.
       3. 3. In the left sidebar, click **Bot**. Click **Reset Token** (or it may already show one) and **copy the token** — this is your `DISCORD_BOT_TOKEN`. Treat it like a password; never share it or commit it to a public repo.
          4. 4. On the same Bot page, scroll to **Privileged Gateway Intents** and turn ON:
             5.    - **Server Members Intent** (required for Onboarding — `guildMemberAdd`)
                   -    - **Message Content Intent** (required for Resource recommendation — reading message text in `#beginner-help`)
                        - 5. On the **General Information** page, copy the **Application ID** — this is your `DISCORD_CLIENT_ID`.
                         
                          6. ## Step 2 — Invite the bot to the Kaizen server
                         
                          7. 1. In the Developer Portal, go to **OAuth2 → URL Generator**.
                             2. 2. Under **Scopes**, check `bot` and `applications.commands`.
                                3. 3. Under **Bot Permissions**, check: `Manage Roles`, `Send Messages`, `Read Messages/View Channels`, `Read Message History`, `Add Reactions`, `Use Slash Commands`.
                                   4. 4. Copy the generated URL, open it in your browser, choose the Kaizen group server, and click **Authorize**.
                                      5. 5. **Role hierarchy matters**: in Discord's Server Settings → Roles, drag the bot's own role (it'll appear after inviting) **above** all the `LvlN` and `Unverified` roles. A bot can only assign/remove roles that sit below its own role in the list — if you skip this, role assignment will silently fail.
                                        
                                         6. ## Step 3 — Configure the bot's environment
                                        
                                         7. 1. Copy the bot's folder (`discord-bot/`) to wherever you'll run/host it.
                                            2. 2. Inside that folder, copy `.env.example` to `.env`:
                                               3.    ```
                                                        cp .env.example .env
                                                        ```
                                                     3. Edit `.env` and fill in:
                                                     4.    ```
                                                              DISCORD_BOT_TOKEN=<the token from Step 1.3>
                                                              DISCORD_CLIENT_ID=<the Application ID from Step 1.5>
                                                              DISCORD_GUILD_ID=1176145747234799696
                                                              ```
                                                              (`DISCORD_GUILD_ID` is already the live Kaizen server ID — only change it if you're testing on a different server.)

                                                       ## Step 4 — Install, register commands, and test locally

                                                 ```
                                                 npm install
                                                 npm run deploy-commands
                                                 npm start
                                                 ```

                                                 - `npm run deploy-commands` registers `/profile` and `/placement-quiz` with Discord for the Kaizen server (instant, guild-scoped — no propagation delay).
                                                 - - `npm start` connects the bot. On success you'll see `Logged in as <BotName>#1234. Serving 1 guild(s).` in the console, and the bot will show as Online in Discord.
                                                   - - Test each automation: have a test account join the server (Onboarding), run `/placement-quiz` (Skill assessment), have a MOD react ✅ on a message in a Level forum (Role assignment), post a message in a tracked channel then run `/profile` (Progress tracking), and ask a question in `#beginner-help` containing a keyword from `data/resources.json` (Resource recommendation).
                                                     - - Stop the bot with `Ctrl+C` when done testing locally — a laptop going to sleep or closing will disconnect it, which is why you need real hosting for "always on" (Step 5).
                                                      
                                                       - > Note: a verified, working `npm install` (with `node_modules` and `package-lock.json`) is already present in this folder from Claude's own testing. You can reuse it as-is, or delete `node_modules` and run `npm install` fresh on your own machine/host — either works, since all dependencies here are pure JavaScript (no native compilation step).
                                                         >
                                                         > ## Step 5 — Host it 24/7
                                                         >
                                                         > Pick one. All three work; ranked by how little setup they need.
                                                         >
                                                         > **Option A — Railway (easiest, free tier available)**
                                                         > 1. Push the `discord-bot/` folder to a new GitHub repo (private is fine — but make sure `.env` is *not* committed; `.gitignore` already excludes it).
                                                         > 2. 2. At [railway.app](https://railway.app), create a new project → **Deploy from GitHub repo** → select the repo.
                                                         >    3. 3. In the project's **Variables** tab, add `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` (same values as your `.env`).
                                                         >       4. 4. Railway auto-detects `npm start` from `package.json` and deploys. Check the **Deployments** log for the "Logged in as..." line.
                                                         >         
                                                         >          5. **Option B — Render (free tier available, similar to Railway)**
                                                         >          6. 1. Push the folder to GitHub as above.
                                                         >             2. 2. At [render.com](https://render.com), **New → Background Worker** (not "Web Service" — this bot doesn't serve HTTP), connect the repo.
                                                         >                3. 3. Build command: `npm install`. Start command: `npm start`.
                                                         >                   4. 4. Add the same 3 environment variables under **Environment**.
                                                         >                     
                                                         >                      5. **Option C — Your own VPS / always-on machine**
                                                         >                      6. 1. Copy the folder to the server, `npm install`, create `.env` with the 3 variables.
                                                         >                         2. 2. Run it persistently with a process manager so it restarts on crash/reboot, e.g.:
                                                         >                            3.    ```
                                                         >                                     npm install -g pm2
                                                         >                                     pm2 start index.js --name ai-academy-bot
                                                         >                                     pm2 save
                                                         >                                     pm2 startup   # follow the printed instructions to survive reboots
                                                         >                                     ```
                                                         >
                                                         > Whichever you pick, re-run `npm run deploy-commands` once after the first deploy (or any time you change a slash command's definition) — it only needs to run once per command change, not on every restart.
                                                         >
                                                         > ---
                                                         >
                                                         > ## Operating notes
                                                         >
                                                         > - **Logs**: the bot prints `[role-assignment] ...` lines to its hosting console/log viewer, and separately posts a one-line log to `#bot-logs` for every graduation it executes — check there if a graduation seems to not have worked.
                                                         > - - **Data file**: `data/store.json` (XP, streaks, quiz results) is created automatically on first run, on whatever host you deploy to. It is *not* synced between your local test run and your hosted deployment — each environment has its own. Back it up periodically if member progress matters to you (it's a single small JSON file).
                                                         >   - - **If a role lookup fails** (console shows `role "LvlN" not found in guild`): someone renamed or deleted a role in Discord. Role/channel names are matched by exact string in `config.js` — fix the name in Discord, or update `config.js` to match.
                                                         >     - - **Permission overwrites are still your call**: this bot assigns/removes roles, but per `32_ROLE_GATING_DESIGN.md` and `33_ACTION_LEDGER.md` item A1, the *channel-visibility permission overwrites* that make each `LvlN` role actually unlock its channel are a separate, Delis-only access-control step — the bot doesn't touch permission overwrites at all, only role membership.
