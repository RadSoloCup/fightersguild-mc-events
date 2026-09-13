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
// file — it keeps its own small seasons.json (just name/theme/dates, no
// reward items) for the Fluxer + Portal announcements. Keep the season
// NAMES and the anchor date in sync by hand between the two if you edit
// the rotation.
var BP =
{
  "levelsPerSeason": 30,
  "xpPerLevel": 1200,
  "anchorDate": "2026-09-13",
  "seasons": [
    {
      "name": "Harvest Moon",
      "theme": "Halloween → Christmas",
      "emoji": "🎃",
      "color": "gold",
      "firstLogin": {
        "message": "Welcome to the Harvest Moon Battlepass! Here's a bounty to get you started.",
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
        "message": "Welcome to the New Year's Frost Battlepass! (placeholder rewards - edit battlepass_seasons.json before this season launches)",
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
        "message": "Welcome to the Bloom & Renewal Battlepass! (placeholder rewards - edit battlepass_seasons.json before this season launches)",
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
        "message": "Welcome to the Harvest Festival Battlepass! (placeholder rewards - edit battlepass_seasons.json before this season launches)",
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
  return {
    key: 'S' + seasonNumber,
    seasonNumber: seasonNumber,
    def: def,
    startDate: startDate,
    endDate: endDate,
    dayOfSeason: Math.floor((now.getTime() - startDate.getTime()) / 86400000),
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

function bpRunGive(server, playerName, commands) {
  if (!commands) return
  for (var i = 0; i < commands.length; i++) {
    var cmd = commands[i].split('{player}').join(playerName)
    try { server.runCommandSilent(cmd) } catch (e) { bpLog('command failed [' + cmd + ']: ' + e) }
  }
}

function bpEnsureScoreboard(server, season) {
  try {
    server.runCommandSilent('scoreboard objectives add bp_level dummy {"text":""}')
  } catch (e) { /* already exists, fine */ }
  try {
    var title = season.def.emoji + ' ' + season.def.name + ' (Lv.)'
    server.runCommandSilent('scoreboard objectives modify bp_level displayname {"text":"' + title + '"}')
    server.runCommandSilent('scoreboard objectives setdisplay sidebar bp_level')
  } catch (e) { bpLog('scoreboard setup failed: ' + e) }
}

function bpUpdateScore(server, playerName, level) {
  try { server.runCommandSilent('scoreboard players set ' + playerName + ' bp_level ' + level) }
  catch (e) { bpLog('scoreboard update failed: ' + e) }
}

function bpAnnounceLevelUp(server, p, playerName, season, newLevel) {
  try {
    server.runCommandSilent('title ' + playerName + ' title {"text":"' + season.def.emoji + ' Battlepass Level ' + newLevel + '!","color":"' + season.def.color + '"}')
    server.runCommandSilent('title ' + playerName + ' subtitle {"text":"' + season.def.name + '"}')
    server.runCommandSilent('playsound minecraft:entity.player.levelup player ' + playerName)
  } catch (e) { bpLog('level-up announce failed: ' + e) }
}

// ── login: season rollover, first-login bonus, daily reward ────────────────
PlayerEvents.loggedIn(event => {
  var season = bpCurrentSeason()
  if (!season) return
  var p = event.player
  var name = p.getUsername ? p.getUsername() : p.getName().getString()
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
      server.runCommandSilent('title ' + name + ' title {"text":"' + season.def.emoji + ' ' + season.def.name + '","color":"' + season.def.color + '"}')
      server.runCommandSilent('title ' + name + ' subtitle {"text":"' + season.def.theme + '"}')
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
  bpUpdateScore(server, name, state.level)

  try {
    var xpPerLevel = BP.xpPerLevel
    var needed = xpPerLevel - (state.seasonXp % xpPerLevel)
    p.tell('§6[Battlepass] §f' + season.def.name + ' — Level ' + state.level + '/' + BP.levelsPerSeason +
      ' (' + needed + ' XP to next level)')
  } catch (e) {}
})

// ── periodic XP sync + level-up handling ────────────────────────────────────
var bpTickCounter = 0
ServerEvents.tick(event => {
  bpTickCounter = bpTickCounter + 1
  if (bpTickCounter % 100 !== 0) return // ~every 5s
  if (!BP) return

  var season = bpCurrentSeason()
  if (!season) return
  var server = event.server
  var onlinePlayers = server.players
  var i = 0
  for (i = 0; i < onlinePlayers.length; i++) {
    var p = onlinePlayers[i]
    var name = p.getUsername ? p.getUsername() : p.getName().getString()
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
    if (leveledUp) bpUpdateScore(server, name, state.level)
  }
})

bpLog('script loaded, config ' + (BP ? 'OK (' + BP.seasons.length + ' seasons)' : 'FAILED TO LOAD'))
