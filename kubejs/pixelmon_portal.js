// priority: 0
//
// Two-way portal between the main overworld and the Pixelmon world, at a
// fixed overworld coordinate. Built as a visible crying-obsidian frame with
// blue soul particles (nether-portal-shaped, but a distinct look/color) —
// not a real portal block, since that always leads to the vanilla Nether.
// Stepping into the frame teleports via the same tick-driven proximity
// check + runCommandSilent technique already proven in battlepass.js.
//
// Getting the player's current dimension took several iterations because
// Rhino's normal `obj.method()` dispatch doesn't reach every method visible
// via raw reflection: `p.kjs$getLevel()` (KubeJS's own mixin-injected
// accessor — prefixed to avoid clashing with real mod/vanilla names) throws
// "Cannot find function" when called directly, and vanilla's own methods
// don't even appear under readable names via reflection at all (production
// Forge runs on SRG-obfuscated bytecode — only mod-added methods keep their
// real source names in the compiled jar). The fix: invoke via
// java.lang.reflect.Method directly, which sidesteps Rhino's dispatch rules
// entirely, and use kjs$getDimension() (found via a live reflection dump of
// ServerLevel's own methods) instead of chasing vanilla's dimension()/
// location().

var PORTAL_LOG = '[pixelmon_portal] '
function pLog(msg) { console.log(PORTAL_LOG + msg) }

var OVERWORLD_DIM = 'minecraft:overworld'
var PIXELMON_DIM = 'fightersguild:pixelmon_world'
var PORTAL_X = 278
var PORTAL_Y = 69
var PORTAL_Z = 73
var PORTAL_RADIUS = 3

var RETURN_X = 0
var RETURN_Y = 101
var RETURN_Z = 0

function pPlayerName(p) {
  return p.getUsername ? p.getUsername() : p.getName().getString()
}

function pReflectInvoke(obj, methodName) {
  if (obj === null || obj === undefined) return null
  var methods = obj.getClass().getMethods()
  var i
  for (i = 0; i < methods.length; i++) {
    if (methods[i].getName() === methodName && methods[i].getParameterTypes().length === 0) {
      methods[i].setAccessible(true)
      return methods[i].invoke(obj, [])
    }
  }
  throw new Error('no zero-arg method named ' + methodName + ' on ' + obj.getClass().getName())
}

var pDimAccessorLogged = false
function pReadDimension(p) {
  var val = null
  try {
    var lvl = pReflectInvoke(p, 'kjs$getLevel')
    val = String(pReflectInvoke(lvl, 'kjs$getDimension'))
  } catch (e) {
    if (!pDimAccessorLogged) pLog('dimension read FAILED: ' + e)
  }
  if (!pDimAccessorLogged) { pDimAccessorLogged = true; pLog('dimension accessor OK, sample=' + val) }
  return val
}

// ── visible portal frame: crying obsidian border, blue soul particle swirl ─
function pBuildFrame(server, dim, x, y, z) {
  var cmds = [
    // solid crying-obsidian block, then carve a 2-wide x 3-tall walkthrough
    'fill ' + (x - 1) + ' ' + y + ' ' + z + ' ' + (x + 2) + ' ' + (y + 4) + ' ' + z + ' minecraft:crying_obsidian',
    'fill ' + x + ' ' + (y + 1) + ' ' + z + ' ' + (x + 1) + ' ' + (y + 3) + ' ' + z + ' minecraft:air',
  ]
  var i
  for (i = 0; i < cmds.length; i++) {
    try { server.runCommandSilent('execute in ' + dim + ' run ' + cmds[i]) }
    catch (e) { pLog('frame build failed [' + cmds[i] + ']: ' + e) }
  }
}

function pSpawnFrameParticles(server, dim, x, y, z) {
  var cmd = 'particle minecraft:soul ' + (x + 0.5) + ' ' + (y + 2) + ' ' + (z + 0.5) + ' 0.4 1.2 0.05 0.01 4'
  try { server.runCommandSilent('execute in ' + dim + ' run ' + cmd) } catch (e) {}
}

var pFramesBuilt = false
function pEnsureFrames(server) {
  if (pFramesBuilt) return
  pFramesBuilt = true
  try {
    // Small platform under the return frame — the Pixelmon world's terrain
    // there is unknown/unexplored, so this guarantees solid, safe ground.
    server.runCommandSilent('execute in ' + PIXELMON_DIM + ' run fill ' + (RETURN_X - 3) + ' ' + (RETURN_Y - 1) + ' ' + (RETURN_Z - 3) + ' ' + (RETURN_X + 3) + ' ' + (RETURN_Y - 1) + ' ' + (RETURN_Z + 3) + ' minecraft:polished_blackstone')
  } catch (e) { pLog('return platform build failed: ' + e) }
  pBuildFrame(server, OVERWORLD_DIM, PORTAL_X - 1, PORTAL_Y - 1, PORTAL_Z)
  pBuildFrame(server, PIXELMON_DIM, RETURN_X - 1, RETURN_Y - 1, RETURN_Z)
  pLog('built portal frames at overworld ' + PORTAL_X + ',' + PORTAL_Y + ',' + PORTAL_Z + ' and pixelmon world ' + RETURN_X + ',' + RETURN_Y + ',' + RETURN_Z)
}

var pPortalCooldownUntil = {} // playerName -> tick count

var pTick = 0
ServerEvents.tick(event => {
  pTick = pTick + 1
  var server = event.server

  if (pTick % 10 !== 0) return // check twice a second — a portal should feel responsive
  pEnsureFrames(server)

  // Ambient particle swirl at both frames regardless of anyone being nearby.
  pSpawnFrameParticles(server, OVERWORLD_DIM, PORTAL_X, PORTAL_Y, PORTAL_Z)
  pSpawnFrameParticles(server, PIXELMON_DIM, RETURN_X, RETURN_Y, RETURN_Z)

  var onlinePlayers = server.players
  var i
  for (i = 0; i < onlinePlayers.length; i++) {
    var p = onlinePlayers[i]
    var name = pPlayerName(p)
    if (pPortalCooldownUntil[name] && pTick < pPortalCooldownUntil[name]) continue

    var dim = pReadDimension(p)
    if (!dim) continue
    var x = p.getX(), y = p.getY(), z = p.getZ()

    if (dim === OVERWORLD_DIM) {
      if (Math.abs(x - PORTAL_X) <= PORTAL_RADIUS && Math.abs(y - PORTAL_Y) <= PORTAL_RADIUS + 1 && Math.abs(z - PORTAL_Z) <= PORTAL_RADIUS) {
        try {
          server.runCommandSilent('execute as ' + name + ' in ' + PIXELMON_DIM + ' run tp @s ' + RETURN_X + ' ' + RETURN_Y + ' ' + RETURN_Z)
          p.tell('§d[Portal] §fWelcome to the Pixelmon world!')
          pLog(name + ' entered the Pixelmon world')
        } catch (e) { pLog('teleport to pixelmon world failed: ' + e) }
        pPortalCooldownUntil[name] = pTick + 60
      }
    } else if (dim === PIXELMON_DIM) {
      if (Math.abs(x - RETURN_X) <= PORTAL_RADIUS && Math.abs(z - RETURN_Z) <= PORTAL_RADIUS) {
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

pLog('script loaded — overworld portal at ' + PORTAL_X + ' ' + PORTAL_Y + ' ' + PORTAL_Z + ' (radius ' + PORTAL_RADIUS + '), return portal at ' + RETURN_X + ' ' + RETURN_Y + ' ' + RETURN_Z)
