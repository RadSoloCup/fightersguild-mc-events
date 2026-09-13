const env = process.env

export const config = {
  runOnce: env.RUN_ONCE === '1' || env.RUN_ONCE === 'true',
  stateDir: env.STATE_DIR || '/data',
  userAgent: env.USER_AGENT || 'fightersguild-mc-events (+https://github.com/RadSoloCup/fightersguild-mc-events)',
  cron: env.CRON_CHECK || '*/15 * * * *',

  fluxer: {
    webhookUrl: env.FLUXER_WEBHOOK_URL || null,
  },

  portal: {
    // e.g. https://chat.example.com/portal
    baseUrl: env.PORTAL_BASE_URL ? env.PORTAL_BASE_URL.replace(/\/$/, '') : null,
    ingestToken: env.PORTAL_EVENTS_INGEST_TOKEN || null,
  },
}

export function assertConfig() {
  if (!config.fluxer.webhookUrl && !(config.portal.baseUrl && config.portal.ingestToken)) {
    throw new Error('Nothing to do — set FLUXER_WEBHOOK_URL and/or PORTAL_BASE_URL + PORTAL_EVENTS_INGEST_TOKEN')
  }
}
