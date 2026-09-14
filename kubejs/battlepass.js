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
// Each season is its own full 3-month theme with name/emoji/color plus:
//   - `horde` { everyDays, spawnMultiplier } — every `everyDays` in-game
//     days, every NATURALLY-spawning zombie gets cloned in place
//     `spawnMultiplier`x (see the EntityEvents.spawned hook below), rather
//     than /summon-ing new zombies at chosen coordinates near players — the
//     latter risked landing inside someone's claimed base. Cloning at a
//     spawn vanilla/FTBChunks already approved means the extras can never
//     appear anywhere a normal zombie couldn't have. Warns everyone with a
//     title card the day before.
//   - `snow` { everyDays, durationTicks } — periodic weather trigger
//     (renders as snow only in cold biomes, rain elsewhere; vanilla has no
//     "force snow everywhere" override).
//   - `decor` { tag, items } — tagged item_display entities scattered near
//     online players, auto-removed the moment the season ends. Real block
//     placement was considered and rejected: there's no sandboxed way to
//     query terrain height from here, and tracking placed block coords in
//     memory wouldn't survive a restart, so decor uses entities instead,
//     which persist correctly through restarts and can never destroy a
//     player's build.
var BP =
{
  "levelsPerSeason": 30,
  "xpPerLevel": 1200,
  "anchorDate": "2026-09-13",
  "seasons": [
    {
      "name": "Trick or Trainer",
      "emoji": "🎃",
      "color": "gold",
      "horde": { "everyDays": 7, "spawnMultiplier": 12 },
      "firstLogin": {
        "message": "Welcome to Trick or Trainer! Here's a bounty to get you started.",
        "give": [
          "give {player} pixelmon:poke_ball 10",
          "give {player} pixelmon:great_ball 5",
          "give {player} pixelmon:full_restore 3",
          "give {player} pixelmon:rare_candy 5",
          "give {player} pixelmon:potion 10"
        ]
      },
      "daily": [
        ["give {player} pixelmon:poke_ball 5", "give {player} pixelmon:potion 5"],
        ["give {player} pixelmon:great_ball 3", "give {player} pixelmon:super_potion 5"],
        ["give {player} pixelmon:rare_candy 2", "give {player} pixelmon:revive 2"],
        ["give {player} pixelmon:ultra_ball 2", "give {player} pixelmon:full_heal 3"],
        ["give {player} pixelmon:hyper_potion 3"],
        ["give {player} pixelmon:rare_candy 3"],
        ["give {player} pixelmon:great_ball 5", "give {player} pixelmon:max_potion 2"]
      ],
      "levels": {
        "1": ["give {player} pixelmon:poke_ball 10"],
        "2": ["give {player} pixelmon:potion 10"],
        "3": ["give {player} pixelmon:great_ball 5"],
        "4": ["give {player} pixelmon:rare_candy 3"],
        "5": ["give {player} pixelmon:super_potion 8"],
        "6": ["give {player} pixelmon:full_heal 5"],
        "7": ["give {player} pixelmon:ultra_ball 5"],
        "8": ["give {player} pixelmon:rare_candy 5", "give {player} pixelmon:revive 3"],
        "9": ["give {player} pixelmon:exp_share 1"],
        "10": ["give {player} pixelmon:hyper_potion 5"],
        "11": ["give {player} pixelmon:fire_stone 1"],
        "12": ["give {player} pixelmon:water_stone 1"],
        "13": ["give {player} pixelmon:rare_candy 8"],
        "14": ["give {player} pixelmon:thunder_stone 1"],
        "15": ["give {player} pixelmon:leaf_stone 1"],
        "16": ["give {player} pixelmon:max_potion 5"],
        "17": ["give {player} pixelmon:rare_candy 10"],
        "18": ["give {player} pixelmon:moon_stone 1"],
        "19": ["give {player} pixelmon:max_revive 3"],
        "20": ["give {player} pixelmon:ability_capsule 1"],
        "21": ["give {player} pixelmon:full_restore 5"],
        "22": ["give {player} pixelmon:destiny_knot 1"],
        "23": ["give {player} pixelmon:everstone 2"],
        "24": ["give {player} pixelmon:choice_band 1"],
        "25": ["give {player} pixelmon:life_orb 1"],
        "26": ["give {player} pixelmon:leftovers 1"],
        "27": ["give {player} pixelmon:pp_up 3"],
        "28": ["give {player} pixelmon:rare_candy 16"],
        "29": ["give {player} pixelmon:ultra_ball 10"],
        "30": [
          "give {player} pixelmon:master_ball 2",
          "give {player} pixelmon:rare_candy 32",
          "give {player} pixelmon:full_restore 5",
          "give {player} pixelmon:pp_up 5"
        ]
      }
    },
    {
      "name": "A Very Rad Xmas",
      "emoji": "🎄",
      "color": "green",
      "snow": { "everyDays": 3, "durationTicks": 6000 },
      "decor": {
        "tag": "bp_xmas_decor",
        "items": ["minecraft:spruce_sapling", "minecraft:red_shulker_box", "minecraft:lime_shulker_box", "minecraft:snow_block"]
      },
      "firstLogin": {
        "message": "A Very Rad Xmas has begun! Here's a gift to get you started.",
        "give": [
          "give {player} minecraft:diamond 5",
          "give {player} minecraft:netherite_scrap 2",
          "give {player} minecraft:cake 2",
          "give {player} minecraft:experience_bottle 20",
          "give {player} minecraft:iron_ingot 16"
        ]
      },
      "daily": [
        ["give {player} minecraft:cookie 12", "give {player} minecraft:bread 8"],
        ["give {player} minecraft:apple 8", "give {player} minecraft:cooked_beef 4"],
        ["give {player} minecraft:coal 16", "give {player} minecraft:experience_bottle 3"],
        ["give {player} minecraft:iron_ingot 4", "give {player} minecraft:sweet_berries 8"],
        ["give {player} minecraft:cooked_porkchop 6", "give {player} minecraft:honey_bottle 2"],
        ["give {player} minecraft:pumpkin_pie 4"],
        ["give {player} minecraft:baked_potato 8", "give {player} minecraft:experience_bottle 2"]
      ],
      "levels": {
        "1": ["give {player} minecraft:cookie 12"],
        "2": ["give {player} minecraft:cake 1"],
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
        "19": ["give {player} minecraft:blue_ice 16"],
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


// ── season math ──────────────────────────────────────────────────────────
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
  return {
    key: 'S' + seasonNumber,
    seasonNumber: seasonNumber,
    def: def,
    startDate: startDate,
    endDate: endDate,
    dayOfSeason: dayOfSeason,
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

// ── NO persistent HUD element at all — text only. Progress shows as an
// actionbar line (plain text above the hotbar, fades on its own after a
// couple seconds — not a widget, nothing left behind) whenever XP is
// gained, plus the usual chat/title messages on login and level-up. ───────
function bpProgressBarText(pct, width) {
  var filled = Math.round(pct * width)
  var bar = ''
  for (var i = 0; i < width; i++) bar += i < filled ? '▓' : '░'
  return bar
}
function bpShowProgress(server, playerName, def, level, xpIntoLevel, xpPerLevel) {
  var pct = Math.max(0, Math.min(1, xpIntoLevel / xpPerLevel))
  var bar = bpProgressBarText(pct, 20)
  var text = def.emoji + ' Lv.' + level + ' ' + bar + ' ' + xpIntoLevel + '/' + xpPerLevel
  try { server.runCommandSilent('title ' + playerName + ' actionbar {"text":"' + text + '"}') }
  catch (e) { bpLog('actionbar progress failed: ' + e) }
}

function bpAnnounceLevelUp(server, p, playerName, season, newLevel) {
  var def = season.def
  try {
    server.runCommandSilent('title ' + playerName + ' title {"text":"' + def.emoji + ' Battlepass Level ' + newLevel + '!","color":"' + def.color + '"}')
    server.runCommandSilent('title ' + playerName + ' subtitle {"text":"' + def.name + '"}')
    server.runCommandSilent('playsound minecraft:entity.player.levelup player ' + playerName)
  } catch (e) { bpLog('level-up announce failed: ' + e) }
}

// ── hover-preview of the next reward (the closest vanilla gets to a "photo" —
// hovering the bracketed item name in chat shows Minecraft's real item-icon
// tooltip; there's no way to show an arbitrary image without a resource pack
// or a custom GUI mod) ───────────────────────────────────────────────────────
function bpParseGiveItem(cmd) {
  var m = cmd.match(/give \{player\}\s+([a-z_]+:[a-z_]+)(?:\{[\s\S]*\})?\s+(\d+)/)
  if (!m) return null
  return { id: m[1], count: Number(m[2]) }
}
function bpNextRewardPreview(server, playerName, season, level) {
  if (level >= BP.levelsPerSeason) return
  var cmds = season.def.levels[String(level + 1)]
  if (!cmds || !cmds.length) return
  var item = bpParseGiveItem(cmds[0])
  if (!item) return
  var label = item.id.replace(/^[a-z_]+:/, '').replace(/_/g, ' ') + (item.count > 1 ? ' x' + item.count : '')
  var json = [
    { text: 'Next unlock (Lv.' + (level + 1) + '): ' },
    { text: '[' + label + ']', color: 'yellow', hoverEvent: { action: 'show_item', contents: { id: item.id, count: item.count } } },
  ]
  try { server.runCommandSilent('tellraw ' + playerName + ' ' + JSON.stringify(json)) }
  catch (e) { bpLog('next-reward preview failed: ' + e) }
}

// ── Halloween horde: every `everyDays` in-game days, warns everyone the day
// before. Doesn't /summon anything near players (that risked landing inside
// claimed/protected land) — instead it amplifies zombies the game *already*
// decided to naturally spawn (see the EntityEvents.spawned hook below), so
// every extra zombie only ever appears somewhere vanilla/FTBChunks already
// approved a spawn, i.e. never inside a player's claim. ────────────────────
var bpLastHordeWarnDay = -1
var bpLastHordeAnnounceDay = -1
var bpHordeActiveDay = -1 // dayOfSeason for which the spawn-amplifier is live; -1 = off
function bpCheckHorde(server, season) {
  var horde = season.def.horde
  var d = season.dayOfSeason

  if (!horde) { bpHordeActiveDay = -1; return }
  var every = horde.everyDays

  if (d > 0 && (d + 1) % every === 0 && bpLastHordeWarnDay !== d) {
    bpLastHordeWarnDay = d
    try {
      server.runCommandSilent('title @a title {"text":"⚠ A horde approaches...","color":"red"}')
      server.runCommandSilent('title @a subtitle {"text":"Tomorrow. Prepare yourselves."}')
      server.runCommandSilent('playsound minecraft:entity.wither.spawn master @a')
    } catch (e) { bpLog('horde warning failed: ' + e) }
  }

  if (d > 0 && d % every === 0) {
    bpHordeActiveDay = d
    if (bpLastHordeAnnounceDay !== d) {
      bpLastHordeAnnounceDay = d
      try {
        server.runCommandSilent('title @a title {"text":"🧟 THE HORDE IS HERE","color":"dark_red"}')
        server.runCommandSilent('playsound minecraft:entity.zombie.ambient master @a')
      } catch (e) {}
      bpLog('horde night active, day ' + d + ' (spawn multiplier ' + horde.spawnMultiplier + 'x)')
    }
  } else {
    bpHordeActiveDay = -1
  }
}

// Every NATURAL zombie spawn (never our own clones, never player-summoned —
// gated on getSpawnType() === 'NATURAL') gets cloned in place a few extra
// times while the horde is active, turning the night's normal zombie count
// into spawnMultiplier x that, without ever picking a spawn point ourselves.
EntityEvents.spawned(event => {
  if (!BP || bpHordeActiveDay < 0) return
  var e = event.entity
  if (!e || e.type !== 'minecraft:zombie') return
  var spawnType = null
  try { spawnType = e.getSpawnType() } catch (err) { return }
  if (spawnType !== 'NATURAL') return

  var season = bpCurrentSeason()
  if (!season || season.dayOfSeason !== bpHordeActiveDay) return
  var horde = season.def.horde
  if (!horde) return
  var extra = (horde.spawnMultiplier || 1) - 1
  if (extra <= 0) return

  var server = event.server
  var x = e.getX(), y = e.getY(), z = e.getZ()
  var i
  for (i = 0; i < extra; i++) {
    var dx = (Math.random() * 4 - 2).toFixed(1)
    var dz = (Math.random() * 4 - 2).toFixed(1)
    try { server.runCommandSilent('execute positioned ' + x + ' ' + y + ' ' + z + ' run summon minecraft:zombie ~' + dx + ' ~ ~' + dz) }
    catch (e2) { bpLog('horde amplify failed: ' + e2) }
  }
})

// ── Christmas snow: periodic weather trigger (renders as snow in cold biomes,
// rain elsewhere — vanilla has no "force snow everywhere" regardless of
// biome temperature) ─────────────────────────────────────────────────────────
var bpLastSnowDay = -1
function bpCheckSnow(server, season) {
  var snow = season.def.snow
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
// moment the season changes ─────────────────────────────────────────────────
var bpDecorActiveKey = null
var bpDecorActiveTag = null
var bpDecorPlaced = false
function bpSyncDecor(server, season) {
  var decor = season.def.decor
  var newTag = decor ? decor.tag : null

  if (bpDecorActiveKey !== season.key) {
    if (bpDecorActiveTag) {
      try {
        server.runCommandSilent('kill @e[type=minecraft:item_display,tag=' + bpDecorActiveTag + ']')
        bpLog('cleared decor tag ' + bpDecorActiveTag)
      } catch (e) { bpLog('decor cleanup failed: ' + e) }
    }
    bpDecorActiveKey = season.key
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
  bpLog('placed decor for ' + season.key)
}

// ── login: season rollover, first-login bonus, daily reward ────────────────
PlayerEvents.loggedIn(event => {
  var season = bpCurrentSeason()
  if (!season) return
  var p = event.player
  var name = bpPlayerName(p)
  var server = event.server

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
      server.runCommandSilent('title ' + name + ' title {"text":"' + season.def.emoji + ' ' + season.def.name + '","color":"' + season.def.color + '"}')
      p.tell('§6[Battlepass] §f' + season.def.firstLogin.message)
    } catch (e) { bpLog('first-login announce failed: ' + e) }
    bpLog(name + ' started season ' + season.key + ' (' + season.def.name + ')')
  }

  if (state.lastDailyDay !== season.dayOfSeason) {
    var pool = season.def.daily
    var pick = pool[((season.dayOfSeason % pool.length) + pool.length) % pool.length]
    bpRunGive(server, name, pick)
    state.lastDailyDay = season.dayOfSeason
    try { p.tell('§b[Battlepass] §fDaily bonus claimed!') } catch (e) {}
  }

  bpSaveState(p, state.tag, state)

  try {
    var xpPerLevel = BP.xpPerLevel
    var needed = xpPerLevel - (state.seasonXp % xpPerLevel)
    p.tell('§6[Battlepass] §f' + season.def.name + ' — Level ' + state.level + '/' + BP.levelsPerSeason +
      ' (' + needed + ' XP to next level)')
  } catch (e) {}
  bpNextRewardPreview(server, name, season, state.level)
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

    if (leveledUp) bpNextRewardPreview(server, name, season, state.level)

    if (delta > 0) {
      var xpIntoLevel = state.seasonXp - state.level * xpPerLevel
      bpShowProgress(server, name, season.def, state.level, xpIntoLevel, xpPerLevel)
    }
  }
})

bpLog('script loaded, config ' + (BP ? 'OK (' + BP.seasons.length + ' seasons)' : 'FAILED TO LOAD'))
