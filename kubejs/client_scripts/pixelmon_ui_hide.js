// priority: 0
//
// Removes Pixelmon's main-menu and pause-menu "cosmetics" buttons entirely —
// both open ExtrasEditorScreen, which crashes 100% of the time (Pixelmon bug
// #21364, a Pixelmon/Create incompatibility with no fix for MC 1.20.1).
//
// Base KubeJS has no documented Screen/GUI event API (confirmed via the
// KubeJS wiki — the "ScreenJS" addon everyone points to is actually for
// building brand NEW custom menus, not modifying screens other mods inject
// into). This works around that entirely with the same technique already
// proven server-side: raw reflection. Every field on the current screen is
// scanned for one of type java.util.List; any element in such a list whose
// class name contains "pixelmon" gets removed from the list directly —
// List.remove() is a normal JDK method (not Minecraft's own obfuscated
// bytecode), so it's reachable regardless of what the field is actually
// called at runtime. Heavily try/catched throughout: worst case this does
// nothing, it should never be able to make things worse than the crash it's
// trying to prevent.

var UI_LOG = '[pixelmon_ui_hide] '
function uLog(msg) { console.log(UI_LOG + msg) }

var uMcClass = null
function uGetMinecraft() {
  if (!uMcClass) uMcClass = Java.loadClass('net.minecraft.client.Minecraft')
  return uMcClass.getInstance()
}

function uRemovePixelmonWidgets(screen) {
  var removedAny = false
  try {
    var fields = screen.getClass().getDeclaredFields()
    var i
    for (i = 0; i < fields.length; i++) {
      var f = fields[i]
      try {
        f.setAccessible(true)
        var value = f.get(screen)
        if (value === null || value === undefined) continue
        // Only touch things that are actually a java.util.List instance.
        if (!(value instanceof java.util.List)) continue
        var list = value
        var toRemove = []
        var j
        for (j = 0; j < list.size(); j++) {
          var el = list.get(j)
          if (el === null) continue
          var cls = el.getClass().getName()
          if (cls.toLowerCase().indexOf('pixelmon') !== -1) toRemove.push(el)
        }
        for (j = 0; j < toRemove.length; j++) {
          list.remove(toRemove[j])
          removedAny = true
          uLog('removed widget ' + toRemove[j].getClass().getName() + ' from field ' + f.getName())
        }
      } catch (fieldErr) { /* skip this field, try the next one */ }
    }
  } catch (e) { uLog('scan failed: ' + e) }
  return removedAny
}

var uLastScreen = null
var uLastScreenLogged = false
ClientEvents.tick(event => {
  try {
    var mc = uGetMinecraft()
    var screen = mc.screen
    if (screen === uLastScreen) return
    uLastScreen = screen
    if (screen === null || screen === undefined) return
    var name = screen.getClass().getName()
    if (!uLastScreenLogged) { uLastScreenLogged = true; uLog('sample screen class: ' + name) }
    var removed = uRemovePixelmonWidgets(screen)
    if (removed) uLog('cleaned pixelmon widgets from ' + name)
  } catch (e) {
    if (!uLastScreenLogged) { uLastScreenLogged = true; uLog('tick handler failed: ' + e) }
  }
})

uLog('script loaded')
