// priority: 0
//
// Keeps Pixelmon's inventory/Day-Care menu as its OWN separate menu instead
// of hijacking the vanilla inventory (E key), which broke this pack's
// existing Curios/Aether-Accessories tabs. Pixelmon's InventoryDetectionTickHandler
// does this via a plain ScreenEvent.Opening listener (not a mixin) —
// Pixelmon's own Pokedex/PC/Day-Care menus are untouched by this and stay
// reachable through their own separate keybinds.
//
// v3 — the actual root cause of every earlier failed attempt: on
// ScreenEvent.Opening, event.getScreen() always returns the ORIGINAL,
// unmodified screen that was requested (fixed for the whole dispatch, which
// is exactly what Pixelmon's own onGuiOpen checks against). The screen that
// will actually be created is event.getNewScreen(), which starts equal to
// getScreen() and gets updated by any listener's setNewScreen() call. Since
// this listener is registered at EventPriority.LOWEST (dead last, via the
// raw EventBus 4-arg addListener(EventPriority, boolean, Class, Consumer)
// signature confirmed from decompiling KubeJS's own ForgeEventWrapper),
// Pixelmon's override has already happened by the time we run — so we must
// read getNewScreen() (which reflects that override), not getScreen()
// (which never changes). That mismatch is why nothing ever got reverted
// despite the listener registering and firing correctly the whole time —
// confirmed live: ScreenEvent.Opening logged getScreen() as plain
// InventoryScreen even after Pixelmon's listener ran, while
// ScreenEvent.Init.Post immediately after showed InventoryPixelmonExtendedScreen.

try {
  var ForgeClass = Java.loadClass('net.minecraftforge.common.MinecraftForge')
  var EVENT_BUS = ForgeClass.EVENT_BUS
  var EventPriorityClass = Java.loadClass('net.minecraftforge.eventbus.api.EventPriority')
  var LOWEST = EventPriorityClass.LOWEST
  var OpeningClass = Java.loadClass('net.minecraftforge.client.event.ScreenEvent$Opening')
  var INV_PIXELMON_NAME = 'com.pixelmonmod.pixelmon.client.gui.inventory.InventoryPixelmonExtendedScreen'
  var InventoryScreenClass = Java.loadClass('net.minecraft.client.gui.screens.inventory.InventoryScreen')
  var McClass = Java.loadClass('net.minecraft.client.Minecraft')

  EVENT_BUS.addListener(LOWEST, false, OpeningClass, function (event) {
    try {
      // Only intervene when the ORIGINAL request (event.getScreen(), fixed
      // for the whole dispatch) was the plain E-key InventoryScreen — i.e.
      // Pixelmon auto-hijacked it. If something (like our own P-key script)
      // asked for InventoryPixelmonExtendedScreen directly, getScreen() is
      // already that class, not InventoryScreen, so we leave it alone —
      // otherwise this would immediately undo a deliberate open of Pixelmon's
      // own screen too.
      var original = event.getScreen()
      if (original === null || original === undefined) return
      if (original.getClass().getName() !== 'net.minecraft.client.gui.screens.inventory.InventoryScreen') return

      var proposed = event.getNewScreen()
      if (proposed === null || proposed === undefined) return
      var name = proposed.getClass().getName()
      if (name === INV_PIXELMON_NAME) {
        var mc = McClass.getInstance()
        event.setNewScreen(new InventoryScreenClass(mc.player))
        console.log('[pixelmon_inventory_fix] reverted ' + name + ' back to vanilla InventoryScreen')
      }
    } catch (e) {
      console.log('[pixelmon_inventory_fix] handler failed: ' + e)
    }
  })
  console.log('[pixelmon_inventory_fix] registered on raw EVENT_BUS at LOWEST priority')
} catch (e) {
  console.log('[pixelmon_inventory_fix] setup FAILED: ' + e)
}
