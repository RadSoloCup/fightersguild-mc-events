// priority: 0
//
// Fighters Guild seasonal battlepass. Progression is driven by the player's
// own vanilla XP gains (mob kills, mining, smelting, etc.) — never decreases
// when XP is spent (enchanting), since only positive deltas count.
//
// NOTE on this KubeJS/Rhino runtime: `const`/`let` declared inside a
// repeatedly-invoked event callback (PlayerEvents.loggedIn, ServerEvents.tick)
// can throw "redeclaration of var" on later invocations. Use `var` inside any
// callback body that runs more than once. const/let are fine for one-time
// top-level script setup (this comment block, function defs, config load).

var BP_LOG_PREFIX = '[battlepass] '

function bpLog(msg) { console.log(BP_LOG_PREFIX + msg) }

// Season/reward config lives inline (KubeJS's class filter blocks all file
// I/O — java.nio.file.Files, java.io.File, even `require`/readFileSync are
// unavailable to server scripts — so there's no sandboxed way to read an
// external JSON file from here). Edit this object directly to change
// rewards. The Node service (fightersguild-mc-events) does NOT read this
// file — it keeps its own small seasons.js (just name/theme/dates, no reward
// items) for the Fluxer + Portal announcements. Keep the season NAMES and
// the anchor date in sync by hand between the two if you edit the rotation.
//
// A season can either be a single theme for its whole 3 months (just set
// name/emoji/color at the top level), or split into two `phases` (a day
// range each, via phaseSplitDay) with their own name/emoji/color and
// optional `horde` (periodic mob wave + day-before warning), `snow`
// (periodic weather trigger), and `decor` (tagged item_display entities
// scattered near online players, auto-removed the moment the phase ends —
// real block placement was considered and rejected: there's no sandboxed
// way to query terrain height from here, and tracking placed block coords
// in memory wouldn't survive a restart, so decor uses entities instead,
// which persist correctly through restarts and can never destroy a
// player's build).
var BP =
{
  "levelsPerSeason": 30,
  "xpPerLevel": 1200,
  "anchorDate": "2026-09-13",
  "seasons": [
    {
      "name": "Night of the Living Dead → A Very Rad Xmas",
      "phaseSplitDay": 48,
      "phases": [
        {
          "key": "halloween",
          "name": "Night of the Living Dead",
          "emoji": "🎃",
          "color": "gold",
          "horde": { "everyDays": 7, "countPerPlayer": 8 },
          "decor": {
            "tag": "bp_halloween_decor",
            "items": ["minecraft:carved_pumpkin", "minecraft:jack_o_lantern", "minecraft:pumpkin"]
          }
        },
        {
          "key": "xmas",
          "name": "A Very Rad Xmas",
          "emoji": "🎄",
          "color": "green",
          "snow": { "everyDays": 3, "durationTicks": 6000 },
          "decor": {
            "tag": "bp_xmas_decor",
            "items": ["minecraft:spruce_sapling", "minecraft:red_shulker_box", "minecraft:lime_shulker_box", "minecraft:snow_block"]
          }
        }
      ],
      "firstLogin": {
        "message": "Welcome to the Battlepass! Here's a bounty to get you started.",
        "give": [
          "give {player} minecraft:diamond 5",
          "give {player} minecraft:netherite_scrap 2",
          "give {player} minecraft:golden_apple 8",
          "give {player} minecraft:experience_bottle 20",
          "give {player} minecraft:iron_ingot 16"
        ]
      },
      "daily": [
        ["give {player} minecraft:bread 8", "give {player} minecraft:cooked_chicken 4"],
        ["give {player} minecraft:pumpkin_pie 4", "give {player} minecraft:sweet_berries 8"],
        ["give {player} minecraft:coal 16", "give {player} minecraft:apple 6"],
        ["give {player} minecraft:iron_ingot 4", "give {player} minecraft:experience_bottle 3"],
        ["give {player} minecraft:cooked_beef 6", "give {player} minecraft:honey_bottle 2"],
        ["give {player} minecraft:cookie 12"],
        ["give {player} minecraft:baked_potato 8", "give {player} minecraft:experience_bottle 2"]
      ],
      "levels": {
        "1": ["give {player} minecraft:cooked_chicken 8"],
        "2": ["give {player} minecraft:pumpkin_pie 4"],
        "3": ["give {player} minecraft:coal 16"],
        "4": ["give {player} minecraft:iron_ingot 8"],
        "5": ["give {player} minecraft:sweet_berries 16"],
        "6": ["give {player} minecraft:bread 16"],
        "7": ["give {player} minecraft:cooked_beef 8"],
        "8": ["give {player} minecraft:iron_ingot 16", "give {player} minecraft:experience_bottle 5"],
        "9": ["give {player} minecraft:gold_ingot 8"],
        "10": ["give {player} minecraft:redstone 32"],
        "11": ["give {player} minecraft:lapis_lazuli 16"],
        "12": ["give {player} minecraft:cooked_porkchop 16", "give {player} minecraft:honey_bottle 4"],
        "13": ["give {player} minecraft:diamond 2"],
        "14": ["give {player} minecraft:emerald 8"],
        "15": ["give {player} minecraft:ender_pearl 8"],
        "16": ["give {player} minecraft:gold_block 2"],
        "17": ["give {player} minecraft:diamond 4"],
        "18": ["give {player} minecraft:amethyst_shard 8"],
        "19": ["give {player} minecraft:blaze_rod 8"],
        "20": ["give {player} minecraft:diamond_block 1"],
        "21": ["give {player} minecraft:netherite_scrap 2"],
        "22": ["give {player} minecraft:enchanted_book{StoredEnchantments:[{id:\"minecraft:mending\",lvl:1}]} 1"],
        "23": ["give {player} minecraft:totem_of_undying 1"],
        "24": ["give {player} minecraft:netherite_ingot 1"],
        "25": ["give {player} minecraft:diamond_helmet{Enchantments:[{id:\"minecraft:protection\",lvl:2}]} 1"],
        "26": ["give {player} minecraft:diamond_chestplate{Enchantments:[{id:\"minecraft:protection\",lvl:2}]} 1"],
        "27": ["give {player} minecraft:diamond_leggings{Enchantments:[{id:\"minecraft:protection\",lvl:2}]} 1"],
        "28": ["give {player} minecraft:diamond_boots{Enchantments:[{id:\"minecraft:protection\",lvl:2}]} 1"],
        "29": ["give {player} minecraft:elytra 1"],
        "30": [
          "give {player} minecraft:netherite_ingot 4",
          "give {player} minecraft:diamond 8",
          "give {player} minecraft:totem_of_undying 2",
          "give {player} minecraft:enchanted_golden_apple 2",
          "give {player} minecraft:nether_star 1"
        ]
      }
    },
    {
      "placeholder": true,
      "name": "New Year's Frost",
      "theme": "New Year → Valentine's",
      "emoji": "❄️",
      "color": "aqua",
      "firstLogin": {
        "message": "Welcome to the New Year's Frost Battlepass! (placeholder rewards - edit battlepass.js before this season launches)",
        "give": ["give {player} minecraft:diamond 5", "give {player} minecraft:experience_bottle 20"]
      },
      "daily": [
        ["give {player} minecraft:bread 8"],
        ["give {player} minecraft:coal 16"],
        ["give {player} minecraft:iron_ingot 4"]
      ],
      "levels": {
        "1": ["give {player} minecraft:iron_ingot 8"], "2": ["give {player} minecraft:coal 16"],
        "3": ["give {player} minecraft:bread 16"], "4": ["give {player} minecraft:gold_ingot 4"],
        "5": ["give {player} minecraft:redstone 16"], "6": ["give {player} minecraft:lapis_lazuli 8"],
        "7": ["give {player} minecraft:iron_ingot 16"], "8": ["give {player} minecraft:gold_ingot 8"],
        "9": ["give {player} minecraft:experience_bottle 8"], "10": ["give {player} minecraft:emerald 4"],
        "11": ["give {player} minecraft:diamond 2"], "12": ["give {player} minecraft:ender_pearl 8"],
        "13": ["give {player} minecraft:gold_block 1"], "14": ["give {player} minecraft:diamond 3"],
        "15": ["give {player} minecraft:emerald 8"], "16": ["give {player} minecraft:diamond 4"],
        "17": ["give {player} minecraft:amethyst_shard 8"], "18": ["give {player} minecraft:blaze_rod 8"],
        "19": ["give {player} minecraft:diamond_block 1"], "20": ["give {player} minecraft:netherite_scrap 1"],
        "21": ["give {player} minecraft:netherite_scrap 2"], "22": ["give {player} minecraft:totem_of_undying 1"],
        "23": ["give {player} minecraft:netherite_ingot 1"], "24": ["give {player} minecraft:diamond_helmet 1"],
        "25": ["give {player} minecraft:diamond_chestplate 1"], "26": ["give {player} minecraft:diamond_leggings 1"],
        "27": ["give {player} minecraft:diamond_boots 1"], "28": ["give {player} minecraft:elytra 1"],
        "29": ["give {player} minecraft:netherite_ingot 2"],
        "30": ["give {player} minecraft:netherite_ingot 4", "give {player} minecraft:diamond 8", "give {player} minecraft:totem_of_undying 2"]
      }
    },
    {
      "placeholder": true,
      "name": "Bloom & Renewal",
      "theme": "Easter → Summer",
      "emoji": "🌸",
      "color": "light_purple",
      "firstLogin": {
        "message": "Welcome to the Bloom & Renewal Battlepass! (placeholder rewards - edit battlepass.js before this season launches)",
        "give": ["give {player} minecraft:diamond 5", "give {player} minecraft:experience_bottle 20"]
      },
      "daily": [
        ["give {player} minecraft:apple 8"],
        ["give {player} minecraft:sweet_berries 16"],
        ["give {player} minecraft:cooked_rabbit 6"]
      ],
      "levels": {
        "1": ["give {player} minecraft:sweet_berries 16"], "2": ["give {player} minecraft:apple 8"],
        "3": ["give {player} minecraft:iron_ingot 8"], "4": ["give {player} minecraft:gold_ingot 4"],
        "5": ["give {player} minecraft:redstone 16"], "6": ["give {player} minecraft:lapis_lazuli 8"],
        "7": ["give {player} minecraft:iron_ingot 16"], "8": ["give {player} minecraft:gold_ingot 8"],
        "9": ["give {player} minecraft:experience_bottle 8"], "10": ["give {player} minecraft:emerald 4"],
        "11": ["give {player} minecraft:diamond 2"], "12": ["give {player} minecraft:ender_pearl 8"],
        "13": ["give {player} minecraft:gold_block 1"], "14": ["give {player} minecraft:diamond 3"],
        "15": ["give {player} minecraft:emerald 8"], "16": ["give {player} minecraft:diamond 4"],
        "17": ["give {player} minecraft:amethyst_shard 8"], "18": ["give {player} minecraft:blaze_rod 8"],
        "19": ["give {player} minecraft:diamond_block 1"], "20": ["give {player} minecraft:netherite_scrap 1"],
        "21": ["give {player} minecraft:netherite_scrap 2"], "22": ["give {player} minecraft:totem_of_undying 1"],
        "23": ["give {player} minecraft:netherite_ingot 1"], "24": ["give {player} minecraft:diamond_helmet 1"],
        "25": ["give {player} minecraft:diamond_chestplate 1"], "26": ["give {player} minecraft:diamond_leggings 1"],
        "27": ["give {player} minecraft:diamond_boots 1"], "28": ["give {player} minecraft:elytra 1"],
        "29": ["give {player} minecraft:netherite_ingot 2"],
        "30": ["give {player} minecraft:netherite_ingot 4", "give {player} minecraft:diamond 8", "give {player} minecraft:totem_of_undying 2"]
      }
    },
    {
      "placeholder": true,
      "name": "Harvest Festival",
      "theme": "Summer → Back to School",
      "emoji": "☀️",
      "color": "yellow",
      "firstLogin": {
        "message": "Welcome to the Harvest Festival Battlepass! (placeholder rewards - edit battlepass.js before this season launches)",
        "give": ["give {player} minecraft:diamond 5", "give {player} minecraft:experience_bottle 20"]
      },
      "daily": [
        ["give {player} minecraft:melon_slice 8"],
        ["give {player} minecraft:cooked_beef 6"],
        ["give {player} minecraft:bread 8"]
      ],
      "levels": {
        "1": ["give {player} minecraft:melon_slice 8"], "2": ["give {player} minecraft:cooked_beef 6"],
        "3": ["give {player} minecraft:iron_ingot 8"], "4": ["give {player} minecraft:gold_ingot 4"],
        "5": ["give {player} minecraft:redstone 16"], "6": ["give {player} minecraft:lapis_lazuli 8"],
        "7": ["give {player} minecraft:iron_ingot 16"], "8": ["give {player} minecraft:gold_ingot 8"],
        "9": ["give {player} minecraft:experience_bottle 8"], "10": ["give {player} minecraft:emerald 4"],
        "11": ["give {player} minecraft:diamond 2"], "12": ["give {player} minecraft:ender_pearl 8"],
        "13": ["give {player} minecraft:gold_block 1"], "14": ["give {player} minecraft:diamond 3"],
        "15": ["give {player} minecraft:emerald 8"], "16": ["give {player} minecraft:diamond 4"],
        "17": ["give {player} minecraft:amethyst_shard 8"], "18": ["give {player} minecraft:blaze_rod 8"],
        "19": ["give {player} minecraft:diamond_block 1"], "20": ["give {player} minecraft:netherite_scrap 1"],
        "21": ["give {player} minecraft:netherite_scrap 2"], "22": ["give {player} minecraft:totem_of_undying 1"],
        "23": ["give {player} minecraft:netherite_ingot 1"], "24": ["give {player} minecraft:diamond_helmet 1"],
        "25": ["give {player} minecraft:diamond_chestplate 1"], "26": ["give {player} minecraft:diamond_leggings 1"],
        "27": ["give {player} minecraft:diamond_boots 1"], "28": ["give {player} minecraft:elytra 1"],
        "29": ["give {player} minecraft:netherite_ingot 2"],
        "30": ["give {player} minecraft:netherite_ingot 4", "give {player} minecraft:diamond 8", "give {player} minecraft:totem_of_undying 2"]
      }
    }
  ]
}


// ── season + phase math ─────────────────────────────────────────────────────
// seasonNumber counts up forever from the anchor date (never resets), so the
// same rotation slot years apart is still treated as a fresh season.
function bpMonthsBetween(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
}
function bpAddMonths(d, n) {
  var r = new Date(d.getTime())
  r.setMonth(r.getMonth() + n)
  return r
}
function bpResolvePhase(def, dayOfSeason) {
  if (def.phases && def.phases.length) {
    var idx = 0
    if (def.phaseSplitDay != null && dayOfSeason >= def.phaseSplitDay) idx = 1
    if (idx >= def.phases.length) idx = def.phases.length - 1
    return { key: def.phases[idx].key || ('p' + idx), def: def.phases[idx] }
  }
  return { key: 'single', def: { name: def.name, emoji: def.emoji, color: def.color } }
}
function bpCurrentSeason() {
  if (!BP) return null
  var anchor = new Date(BP.anchorDate + 'T00:00:00Z')
  var now = new Date()
  var months = bpMonthsBetween(anchor, now)
  var seasonNumber = Math.floor(months / 3)
  if (seasonNumber < 0) seasonNumber = 0
  var rotationIndex = seasonNumber % BP.seasons.length
  var def = BP.seasons[rotationIndex]
  var startDate = bpAddMonths(anchor, seasonNumber * 3)
  var endDate = bpAddMonths(anchor, (seasonNumber + 1) * 3)
  var dayOfSeason = Math.floor((now.getTime() - startDate.getTime()) / 86400000)
  var phase = bpResolvePhase(def, dayOfSeason)
  return {
    key: 'S' + seasonNumber,
    seasonNumber: seasonNumber,
    def: def,
    startDate: startDate,
    endDate: endDate,
    dayOfSeason: dayOfSeason,
    phase: phase,
    phaseGlobalKey: 'S' + seasonNumber + ':' + phase.key,
  }
}

// ── XP reading (defensive — logs which accessor worked, once) ──────────────
var bpXpAccessorLogged = false
function bpReadTotalXp(p) {
  var val = null
  var used = null
  try { val = p.getTotalExperience(); used = 'getTotalExperience' } catch (e1) {
    try { val = p.totalExperience; used = 'totalExperience field' } catch (e2) {
      try { val = p.getExperiencePoints(); used = 'getExperiencePoints (fallback, spendable-xp based)' } catch (e3) {
        bpLog('XP READ FAILED — no working accessor: ' + e1 + ' / ' + e2 + ' / ' + e3)
      }
    }
  }
  if (!bpXpAccessorLogged && used) { bpXpAccessorLogged = true; bpLog('XP accessor in use: ' + used) }
  return typeof val === 'number' ? val : 0
}

// ── persistent per-player state (survives relog + restarts) ────────────────
function bpGetState(p) {
  var tag = p.persistentData.getCompound('battlepass')
  return {
    tag: tag,
    seasonKey: tag.getString('seasonKey'),
    seasonXp: tag.getInt('seasonXp'),
    level: tag.getInt('level'),
    lastDailyDay: tag.contains('lastDailyDay') ? tag.getInt('lastDailyDay') : -999999,
    lastKnownTotalXp: tag.contains('lastKnownTotalXp') ? tag.getInt('lastKnownTotalXp') : -1,
  }
}
function bpSaveState(p, tag, state) {
  tag.putString('seasonKey', state.seasonKey)
  tag.putInt('seasonXp', state.seasonXp)
  tag.putInt('level', state.level)
  tag.putInt('lastDailyDay', state.lastDailyDay)
  tag.putInt('lastKnownTotalXp', state.lastKnownTotalXp)
  p.persistentData.put('battlepass', tag)
}

function bpPlayerName(p) {
  return p.getUsername ? p.getUsername() : p.getName().getString()
}

function bpRunGive(server, playerName, commands) {
  if (!commands) return
  for (var i = 0; i < commands.length; i++) {
    var cmd = commands[i].split('{player}').join(playerName)
    try { server.runCommandSilent(cmd) } catch (e) { bpLog('command failed [' + cmd + ']: ' + e) }
  }
}

// ── tab list (NOT sidebar — keeps the main screen clear) ────────────────────
var bpLastScoreboardPhaseGlobalKey = null
function bpEnsureScoreboard(server, season) {
  try { server.runCommandSilent('scoreboard objectives add bp_level dummy {"text":""}') } catch (e) { /* already exists */ }
  if (bpLastScoreboardPhaseGlobalKey === season.phaseGlobalKey) return
  bpLastScoreboardPhaseGlobalKey = season.phaseGlobalKey
  try {
    var title = season.phase.def.emoji + ' ' + season.phase.def.name + ' (Lv.)'
    server.runCommandSilent('scoreboard objectives modify bp_level displayname {"text":"' + title + '"}')
    server.runCommandSilent('scoreboard objectives setdisplay list bp_level') // tab list, not sidebar
  } catch (e) { bpLog('scoreboard setup failed: ' + e) }
}
function bpUpdateScore(server, playerName, level) {
  try { server.runCommandSilent('scoreboard players set ' + playerName + ' bp_level ' + level) }
  catch (e) { bpLog('scoreboard update failed: ' + e) }
}

// ── transient boss-bar progress meter (only shown while actively gaining XP,
// auto-hides ~5-10s after — a real progress bar without a permanent HUD) ────
function bpBossBarId(playerName) {
  return 'minecraft:bp_' + playerName.toLowerCase().replace(/[^a-z0-9_.]/g, '_')
}
var bpBarVisible = {}
function bpShowProgressBar(server, playerName, phase, level, xpIntoLevel, xpPerLevel) {
  var id = bpBossBarId(playerName)
  var pct = Math.max(0, Math.min(1, xpIntoLevel / xpPerLevel))
  try { server.runCommandSilent('bossbar add ' + id + ' {"text":""}') } catch (e) { /* already exists */ }
  try {
    server.runCommandSilent('bossbar set ' + id + ' players ' + playerName)
    server.runCommandSilent('bossbar set ' + id + ' name {"text":"' + phase.def.emoji + ' ' + phase.def.name + ' — Lv.' + level + ' (' + xpIntoLevel + '/' + xpPerLevel + ')"}')
    server.runCommandSilent('bossbar set ' + id + ' max 1000')
    server.runCommandSilent('bossbar set ' + id + ' value ' + Math.round(pct * 1000))
    server.runCommandSilent('bossbar set ' + id + ' visible true')
  } catch (e) { bpLog('bossbar update failed: ' + e) }
}
function bpHideProgressBar(server, playerName) {
  try { server.runCommandSilent('bossbar set ' + bpBossBarId(playerName) + ' visible false') } catch (e) {}
}
function bpRemoveProgressBar(server, playerName) {
  try { server.runCommandSilent('bossbar remove ' + bpBossBarId(playerName)) } catch (e) {}
}

function bpAnnounceLevelUp(server, p, playerName, season, newLevel) {
  var phase = season.phase
  try {
    server.runCommandSilent('title ' + playerName + ' title {"text":"' + phase.def.emoji + ' Battlepass Level ' + newLevel + '!","color":"' + phase.def.color + '"}')
    server.runCommandSilent('title ' + playerName + ' subtitle {"text":"' + phase.def.name + '"}')
    server.runCommandSilent('playsound minecraft:entity.player.levelup player ' + playerName)
  } catch (e) { bpLog('level-up announce failed: ' + e) }
}

// ── hover-preview of the next reward (the closest vanilla gets to a "photo" —
// hovering the bracketed item name in chat shows Minecraft's real item-icon
// tooltip; there's no way to show an arbitrary image without a resource pack
// or a custom GUI mod) ───────────────────────────────────────────────────────
function bpParseGiveItem(cmd) {
  var m = cmd.match(/give \{player\}\s+(minecraft:[a-z_]+)(?:\{[\s\S]*\})?\s+(\d+)/)
  if (!m) return null
  return { id: m[1], count: Number(m[2]) }
}
function bpNextRewardPreview(server, playerName, season, level) {
  if (level >= BP.levelsPerSeason) return
  var cmds = season.def.levels[String(level + 1)]
  if (!cmds || !cmds.length) return
  var item = bpParseGiveItem(cmds[0])
  if (!item) return
  var label = item.id.replace('minecraft:', '').replace(/_/g, ' ') + (item.count > 1 ? ' x' + item.count : '')
  var json = [
    { text: 'Next unlock (Lv.' + (level + 1) + '): ' },
    { text: '[' + label + ']', color: 'yellow', hoverEvent: { action: 'show_item', contents: { id: item.id, count: item.count } } },
  ]
  try { server.runCommandSilent('tellraw ' + playerName + ' ' + JSON.stringify(json)) }
  catch (e) { bpLog('next-reward preview failed: ' + e) }
}

// ── Halloween horde: every `everyDays` in-game days, only while players are
// online; warns everyone the day before ─────────────────────────────────────
var bpLastHordeWarnDay = -1
var bpLastHordeDay = -1
function bpCheckHorde(server, season) {
  var horde = season.phase.def.horde
  if (!horde) return
  var d = season.dayOfSeason
  var every = horde.everyDays

  if (d > 0 && (d + 1) % every === 0 && bpLastHordeWarnDay !== d) {
    bpLastHordeWarnDay = d
    try {
      server.runCommandSilent('title @a title {"text":"⚠ A horde approaches...","color":"red"}')
      server.runCommandSilent('title @a subtitle {"text":"Tomorrow. Prepare yourselves."}')
      server.runCommandSilent('playsound minecraft:entity.wither.spawn master @a')
    } catch (e) { bpLog('horde warning failed: ' + e) }
  }

  if (d > 0 && d % every === 0 && bpLastHordeDay !== d) {
    var onlinePlayers = server.players
    if (onlinePlayers.length === 0) return // don't spawn a horde for nobody
    bpLastHordeDay = d
    var count = horde.countPerPlayer || 8
    var i, j
    for (i = 0; i < onlinePlayers.length; i++) {
      var name = bpPlayerName(onlinePlayers[i])
      for (j = 0; j < count; j++) {
        var dx = Math.floor(Math.random() * 30) - 15
        var dz = Math.floor(Math.random() * 30) - 15
        if (dx > -5 && dx < 5) dx = dx < 0 ? -5 : 5
        if (dz > -5 && dz < 5) dz = dz < 0 ? -5 : 5
        try { server.runCommandSilent('execute at ' + name + ' run summon minecraft:zombie ~' + dx + ' ~ ~' + dz) }
        catch (e) { bpLog('horde spawn failed: ' + e) }
      }
    }
    try {
      server.runCommandSilent('title @a title {"text":"🧟 THE HORDE IS HERE","color":"dark_red"}')
      server.runCommandSilent('playsound minecraft:entity.zombie.ambient master @a')
    } catch (e) {}
    bpLog('spawned horde for day ' + d)
  }
}

// ── Christmas snow: periodic weather trigger (renders as snow in cold biomes,
// rain elsewhere — vanilla has no "force snow everywhere" regardless of
// biome temperature) ─────────────────────────────────────────────────────────
var bpLastSnowDay = -1
function bpCheckSnow(server, season) {
  var snow = season.phase.def.snow
  if (!snow) return
  var d = season.dayOfSeason
  if (d % snow.everyDays !== 0 || bpLastSnowDay === d) return
  bpLastSnowDay = d
  try {
    server.runCommandSilent('weather rain ' + snow.durationTicks)
    bpLog('triggered weather (xmas), day ' + d)
  } catch (e) { bpLog('snow trigger failed: ' + e) }
}

// ── decor: tagged item_display entities near online players, swapped out the
// moment the phase changes (covers phase-within-season AND season rollover,
// since both change phaseGlobalKey) ─────────────────────────────────────────
var bpDecorActiveGlobalKey = null
var bpDecorActiveTag = null
var bpDecorPlaced = false
function bpSyncDecor(server, season) {
  var decor = season.phase.def.decor
  var newTag = decor ? decor.tag : null

  if (bpDecorActiveGlobalKey !== season.phaseGlobalKey) {
    if (bpDecorActiveTag) {
      try {
        server.runCommandSilent('kill @e[type=minecraft:item_display,tag=' + bpDecorActiveTag + ']')
        bpLog('cleared decor tag ' + bpDecorActiveTag)
      } catch (e) { bpLog('decor cleanup failed: ' + e) }
    }
    bpDecorActiveGlobalKey = season.phaseGlobalKey
    bpDecorActiveTag = newTag
    bpDecorPlaced = false
  }

  if (!newTag || bpDecorPlaced) return
  var onlinePlayers = server.players
  if (onlinePlayers.length === 0) return // wait for someone to be online to decorate around
  var items = decor.items
  var i, k
  for (i = 0; i < onlinePlayers.length; i++) {
    var name = bpPlayerName(onlinePlayers[i])
    for (k = 0; k < 20; k++) {
      var dx = Math.floor(Math.random() * 40) - 20
      var dz = Math.floor(Math.random() * 40) - 20
      var item = items[Math.floor(Math.random() * items.length)]
      var cmd = 'execute at ' + name + ' run summon minecraft:item_display ~' + dx + ' ~ ~' + dz +
        ' {item:{id:"' + item + '",Count:1b},Tags:["' + newTag + '"],billboard:"center"}'
      try { server.runCommandSilent(cmd) } catch (e) { bpLog('decor spawn failed: ' + e) }
    }
  }
  bpDecorPlaced = true
  bpLog('placed decor for ' + season.phaseGlobalKey)
}

// ── login: season rollover, first-login bonus, daily reward ────────────────
PlayerEvents.loggedIn(event => {
  var season = bpCurrentSeason()
  if (!season) return
  var p = event.player
  var name = bpPlayerName(p)
  var server = event.server

  bpEnsureScoreboard(server, season)

  var state = bpGetState(p)
  var isNewSeasonForPlayer = state.seasonKey !== season.key

  if (isNewSeasonForPlayer) {
    state.seasonKey = season.key
    state.seasonXp = 0
    state.level = 0
    state.lastDailyDay = -999999
    state.lastKnownTotalXp = bpReadTotalXp(p)
    bpRunGive(server, name, season.def.firstLogin.give)
    try {
      server.runCommandSilent('title ' + name + ' title {"text":"' + season.phase.def.emoji + ' ' + season.phase.def.name + '","color":"' + season.phase.def.color + '"}')
      p.tell('§6[Battlepass] §f' + season.def.firstLogin.message)
    } catch (e) { bpLog('first-login announce failed: ' + e) }
    bpLog(name + ' started season ' + season.key)
  }

  if (state.lastDailyDay !== season.dayOfSeason) {
    var pool = season.def.daily
    var pick = pool[((season.dayOfSeason % pool.length) + pool.length) % pool.length]
    bpRunGive(server, name, pick)
    state.lastDailyDay = season.dayOfSeason
    try { p.tell('§b[Battlepass] §fDaily bonus claimed!') } catch (e) {}
  }

  bpSaveState(p, state.tag, state)
  bpUpdateScore(server, name, state.level)

  try {
    var xpPerLevel = BP.xpPerLevel
    var needed = xpPerLevel - (state.seasonXp % xpPerLevel)
    p.tell('§6[Battlepass] §f' + season.phase.def.name + ' — Level ' + state.level + '/' + BP.levelsPerSeason +
      ' (' + needed + ' XP to next level)')
  } catch (e) {}
  bpNextRewardPreview(server, name, season, state.level)
})

PlayerEvents.loggedOut(event => {
  var name = bpPlayerName(event.player)
  try { bpRemoveProgressBar(event.server, name) } catch (e) {}
  delete bpBarVisible[name]
})

// ── periodic sweep: XP sync + level-ups, world event checks ─────────────────
var bpTickCounter = 0
ServerEvents.tick(event => {
  bpTickCounter = bpTickCounter + 1
  if (bpTickCounter % 100 !== 0) return // ~every 5s
  if (!BP) return

  var season = bpCurrentSeason()
  if (!season) return
  var server = event.server

  bpSyncDecor(server, season)
  bpCheckHorde(server, season)
  bpCheckSnow(server, season)

  var onlinePlayers = server.players
  var i = 0
  for (i = 0; i < onlinePlayers.length; i++) {
    var p = onlinePlayers[i]
    var name = bpPlayerName(p)
    var state = bpGetState(p)
    if (state.seasonKey !== season.key) continue // handled on next login

    var curXp = bpReadTotalXp(p)
    if (state.lastKnownTotalXp < 0) state.lastKnownTotalXp = curXp
    var delta = curXp - state.lastKnownTotalXp
    if (delta > 0) state.seasonXp = state.seasonXp + delta
    state.lastKnownTotalXp = curXp

    var xpPerLevel = BP.xpPerLevel
    var maxLevel = BP.levelsPerSeason
    var leveledUp = false
    while (state.level < maxLevel && state.seasonXp >= (state.level + 1) * xpPerLevel) {
      state.level = state.level + 1
      leveledUp = true
      var rewards = season.def.levels[String(state.level)]
      bpRunGive(server, name, rewards)
      bpAnnounceLevelUp(server, p, name, season, state.level)
    }

    bpSaveState(p, state.tag, state)

    if (leveledUp) {
      bpUpdateScore(server, name, state.level)
      bpNextRewardPreview(server, name, season, state.level)
    }

    var xpIntoLevel = state.seasonXp - state.level * xpPerLevel
    if (delta > 0 || leveledUp) {
      bpShowProgressBar(server, name, season.phase, state.level, xpIntoLevel, xpPerLevel)
      bpBarVisible[name] = true
    } else if (bpBarVisible[name]) {
      bpHideProgressBar(server, name)
      bpBarVisible[name] = false
    }
  }
})

bpLog('script loaded, config ' + (BP ? 'OK (' + BP.seasons.length + ' seasons)' : 'FAILED TO LOAD'))
