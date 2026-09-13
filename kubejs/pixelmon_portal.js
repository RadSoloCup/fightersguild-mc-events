// priority: 0
//
// Two-way portal between the main overworld and the Pixelmon world, at a
// fixed overworld coordinate. No new mod/portal block — same tick-driven
// proximity-check + runCommandSilent technique already proven in
// battlepass.js.
//
// First attempt's dimension read fell through to a `p.dimension` fallback
// that likely returns Java's verbose ResourceKey toString() (e.g.
// "ResourceKey[minecraft:dimension / minecraft:overworld]") rather than a
// plain "minecraft:overworld" string, so the equality check never matched
// and the portal silently did nothing. This version normalizes whatever
// comes back with a regex that pulls the trailing "namespace:path" out of
// either format, and logs the raw + normalized value periodically so this
// is verifiable from the log without needing a live debugging session.

var PORTAL_LOG = '[pixelmon_portal] '
function pLog(msg) { console.log(PORTAL_LOG + msg) }

var OVERWORLD_DIM = 'minecraft:overworld'
var PIXELMON_DIM = 'fightersguild:pixelmon_world'
var PORTAL_X = 278
var PORTAL_Y = 69
var PORTAL_Z = 73
var PORTAL_RADIUS = 3

function pPlayerName(p) {
  return p.getUsername ? p.getUsername() : p.getName().getString()
}

function pNormalizeDim(raw) {
  if (raw === null || raw === undefined) return null
  var s = String(raw)
  var m = s.match(/([a-z0-9_.-]+:[a-z0-9_./-]+)\]?\s*$/)
  return m ? m[1] : s
}

var pDimAccessorLogged = false
function pReadDimensionRaw(p) {
  var val = null
  var used = null
  try { val = p.dimension.location().toString(); used = 'p.dimension.location()' } catch (e1) {
    try { val = p.level.dimension().location().toString(); used = 'p.level.dimension().location()' } catch (e2) {
      try { val = p.getLevel().dimension().location().toString(); used = 'p.getLevel().dimension().location()' } catch (e3) {
        try { val = String(p.dimension); used = 'String(p.dimension)' } catch (e4) {
          try { val = p.getCommandSenderWorld().dimension().location().toString(); used = 'getCommandSenderWorld()' } catch (e5) {
            pLog('DIMENSION READ FAILED — no working accessor: ' + e1 + ' / ' + e2 + ' / ' + e3 + ' / ' + e4 + ' / ' + e5)
          }
        }
      }
    }
  }
  if (!pDimAccessorLogged && used) { pDimAccessorLogged = true; pLog('dimension accessor in use: ' + used + ' raw=' + val) }
  return val
}

var pLastDiagLogTick = {} // playerName -> tick, throttles the periodic position/dimension log

var pPortalCooldownUntil = {} // playerName -> tick count

var pTick = 0
ServerEvents.tick(event => {
  pTick = pTick + 1
  if (pTick % 10 !== 0) return // check twice a second — a portal should feel responsive
  var server = event.server
  var onlinePlayers = server.players
  var i
  for (i = 0; i < onlinePlayers.length; i++) {
    var p = onlinePlayers[i]
    var name = pPlayerName(p)

    var rawDim = pReadDimensionRaw(p)
    var dim = pNormalizeDim(rawDim)
    var x = p.getX(), y = p.getY(), z = p.getZ()

    // Log position + resolved dimension every ~10s per player, purely so we
    // can see exactly what the script sees without needing a live session.
    if (!pLastDiagLogTick[name] || pTick - pLastDiagLogTick[name] >= 200) {
      pLastDiagLogTick[name] = pTick
      pLog(name + ' @ ' + dim + ' (' + x.toFixed(1) + ',' + y.toFixed(1) + ',' + z.toFixed(1) + ')')
    }

    if (pPortalCooldownUntil[name] && pTick < pPortalCooldownUntil[name]) continue
    if (!dim) continue

    if (dim === OVERWORLD_DIM) {
      if (Math.abs(x - PORTAL_X) <= PORTAL_RADIUS && Math.abs(y - PORTAL_Y) <= PORTAL_RADIUS + 1 && Math.abs(z - PORTAL_Z) <= PORTAL_RADIUS) {
        try {
          server.runCommandSilent('execute as ' + name + ' in ' + PIXELMON_DIM + ' run tp @s 0 200 0')
          server.runCommandSilent('execute as ' + name + ' in ' + PIXELMON_DIM + ' run spreadplayers 0 0 5 60 false @s')
          p.tell('§d[Portal] §fWelcome to the Pixelmon world!')
          pLog(name + ' entered the Pixelmon world')
        } catch (e) { pLog('teleport to pixelmon world failed: ' + e) }
        pPortalCooldownUntil[name] = pTick + 60
      }
    } else if (dim === PIXELMON_DIM) {
      if (Math.abs(x) <= PORTAL_RADIUS && Math.abs(z) <= PORTAL_RADIUS) {
        try {
          server.runCommandSilent('execute as ' + name + ' in ' + OVERWORLD_DIM + ' run tp @s ' + PORTAL_X + ' ' + PORTAL_Y + ' ' + PORTAL_Z)
          p.tell('§6[Portal] §fWelcome back!')
          pLog(name + ' returned to the overworld')
        } catch (e) { pLog('teleport to overworld failed: ' + e) }
        pPortalCooldownUntil[name] = pTick + 60
      }
    }
  }
})

pLog('script loaded — overworld portal at ' + PORTAL_X + ' ' + PORTAL_Y + ' ' + PORTAL_Z + ' (radius ' + PORTAL_RADIUS + '), return portal at Pixelmon world spawn (0,0)')
