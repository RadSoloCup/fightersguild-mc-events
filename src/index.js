import { Cron } from 'croner'
import { config, assertConfig } from './config.js'
import { log } from './lib.js'
import { checkAndAnnounce } from './announce.js'

assertConfig()

log(`fightersguild-mc-events starting — checking every "${config.cron}"`)

const tick = () => checkAndAnnounce().catch(err => log('check failed:', err.message))

if (config.runOnce) {
  await tick()
  log('run-once complete')
  process.exit(0)
}

tick() // fire once on boot
new Cron(config.cron, { protect: true }, tick)
