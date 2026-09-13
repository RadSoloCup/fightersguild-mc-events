# fightersguild-mc-events

A seasonal battlepass live-service for the Fighters Guild Minecraft server
(`FTB-Direwolf20-1.20`) — a rotating, holiday-themed pass that resets every 3
months, progresses on the player's own in-game XP, and rewards daily logins.

This is two very different pieces working together:

## 1. The battlepass itself — `kubejs/battlepass.js`

Runs **inside** the Minecraft server via [KubeJS](https://kubejs.com/), not
in this Node service. KubeJS's script sandbox blocks all file I/O (no
`require`, no `readFileSync`, no raw Java file classes are allowed by its
class filter), so the season/reward data is embedded directly as a JS object
literal at the top of the file rather than loaded from a config file — edit
it in place to change rewards.

- **Progression**: every ~5 seconds, each online player's lifetime XP
  (`getTotalExperience()` — doesn't decrease when XP is spent, e.g. at an
  enchanting table) is diffed against last-seen; positive gains add to their
  seasonal battlepass XP. Leveling up runs that level's `/give` command list
  and shows a title pop-up.
- **First login of the season**: a big one-time bonus.
- **Every day logged in**: a smaller bonus (cycles through a themed pool).
- **Visible in-game**: a scoreboard sidebar objective (`bp_level`) is always
  shown; login and level-up both post a chat/title message.
- **Season rotation**: 3-month cycles from a fixed anchor date, through a
  4-theme rotation (Halloween→Christmas, New Year→Valentine's,
  Easter→Summer, Summer→Back to School). The season number counts up
  forever from the anchor, so the same rotation slot a year later is still a
  fresh season for reward-reset purposes.
- 20-40 configurable levels (currently 30) — food/materials early, high-end
  armor and rare materials (diamonds, netherite, totems, elytra) at the top.

**Deploy**: copy `kubejs/battlepass.js` to the server's
`kubejs/server_scripts/battlepass.js`, then `/kubejs reload server_scripts`
(no full server restart needed) via RCON or the console.

**Editing rewards**: the 3 non-launching seasons (`New Year's Frost`,
`Bloom & Renewal`, `Harvest Festival`) currently have placeholder reward
lists — flesh those out in `kubejs/battlepass.js` before each one launches.

## 2. Season announcements — this Node service

Watches the calendar (cron, cheap, no-ops until the season actually rolls
over) and, exactly once per season, announces the launch:

- Posts an embed to a Fluxer channel via webhook.
- Creates a matching entry on the [Fighters Guild
  Portal](https://github.com/RadSoloCup/fightersguild-portal)'s Events page,
  via a small machine-to-machine endpoint added there
  (`POST /api/events/ingest`) — which itself cross-posts to Fluxer through
  the Portal's own bot, if that's configured.

This service does **not** talk to the Minecraft server at all — it only
knows season *identity* (name/theme/dates), in `src/seasons.js`. That file's
rotation and anchor date must be kept in sync **by hand** with the one
embedded in `kubejs/battlepass.js` if you ever change the schedule; there's
no shared config file between the two because of the KubeJS sandboxing
above.

## Deploy (Unraid / Docker Compose)

1. Copy `.env.example` to `mc-events.env` and fill in the Fluxer webhook
   and/or Portal ingest token.
2. Put `compose.snippet.yml` (renamed `docker-compose.yml`) + `mc-events.env`
   in `/boot/config/plugins/compose.manager/projects/mc-events/` and run
   `docker compose up -d --build` — it builds straight from this GitHub
   repo, no local checkout needed.

## Credits

| Project | Used for | License |
| --- | --- | --- |
| [`croner`](https://github.com/hexagon/croner) | the schedule check | MIT |
| [**Fluxer**](https://github.com/fluxerapp/fluxer) | the chat platform and webhook protocol | AGPL-3.0 |
| [KubeJS](https://kubejs.com/) | in-game scripting for the battlepass mechanics | LGPL-3.0 |

## License

Copyright &copy; 2026 Fighters Guild. Licensed under the
[GNU AGPL v3](https://www.gnu.org/licenses/agpl-3.0.html), see [`LICENSE`](LICENSE).

Running a modified version as a network service obliges you to offer its
source to users (AGPL section 13).

---

Made in Canada 🇨🇦
