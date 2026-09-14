// priority: 0
//
// v3: ForgeEvents.onEvent (KubeJS's wrapper) hardcodes EventPriority.NORMAL,
// and registration order between our startup script and Pixelmon's own
// client-setup listener is not guaranteed — if Pixelmon's listener runs
// AFTER ours at the same priority, our scan finds nothing (no error, no
// match, exactly what we saw). Fixed by calling the real Forge EventBus
// method directly with the exact 4-argument signature confirmed from
// decompiling KubeJS's own ForgeEventWrapper class:
//   addListener(EventPriority priority, boolean receiveCanceled, Class type, Consumer consumer)
// and forcing EventPriority.LOWEST so we always run dead last, after
// Pixelmon has definitely already added its buttons.

var PIXELMON_MENU_SCREENS = [
  'net.minecraft.client.gui.screens.TitleScreen',
  'net.minecraft.client.gui.screens.PauseScreen'
]

try {
  var ForgeClass = Java.loadClass('net.minecraftforge.common.MinecraftForge')
  var EVENT_BUS = ForgeClass.EVENT_BUS
  var EventPriorityClass = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
  var LOWEST = EventPriorityClass.LOWEST
  var InitPostClass = Java.loadClass('net.minecraftforge.client.event.ScreenEvent$Init$Post')

  EVENT_BUS.addListener(LOWEST, false, InitPostClass, function (event) {
    try {
      var screen = event.getScreen()
      if (screen === null || screen === undefined) return
      var screenName = screen.getClass().getName()
      if (PIXELMON_MENU_SCREENS.indexOf(screenName) === -1) return

      var listeners = event.getListenersList()
      console.log('[pixelmon_ui_hide] ' + screenName + ' Init.Post (LOWEST) fired, ' + listeners.size() + ' listeners total')
      var toRemove = []
      var i
      for (i = 0; i < listeners.size(); i++) {
        var widget = listeners.get(i)
        if (widget === null) continue
        var widgetClass = widget.getClass().getName()
        console.log('[pixelmon_ui_hide]   [' + i + '] ' + widgetClass)
        if (widgetClass.toLowerCase().indexOf('pixelmon') !== -1) toRemove.push(widget)
      }
      for (i = 0; i < toRemove.length; i++) {
        event.removeListener(toRemove[i])
        console.log('[pixelmon_ui_hide] removed ' + toRemove[i].getClass().getName() + ' from ' + screenName)
      }
      if (toRemove.length === 0) console.log('[pixelmon_ui_hide] no pixelmon widgets matched on ' + screenName)
    } catch (e) {
      console.log('[pixelmon_ui_hide] handler failed: ' + e)
    }
  })
  console.log('[pixelmon_ui_hide] registered on raw EVENT_BUS at LOWEST priority')
} catch (e) {
  console.log('[pixelmon_ui_hide] setup FAILED: ' + e)
}
