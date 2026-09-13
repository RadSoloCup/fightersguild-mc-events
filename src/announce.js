import { config } from './config.js'
import { log, postWebhook, postPortalEvent, loadState, saveState } from './lib.js'
import { currentSeason, LEVELS_PER_SEASON } from './seasons.js'

const fmtDate = d => d.toISOString().slice(0, 10)

function fluxerEmbed(season) {
  const { def, startDate, endDate } = season
  return {
    embeds: [{
      title: `${def.emoji} ${def.name} Battlepass is live!`,
      description: [
        `**${def.theme}**`,
        '',
        `${LEVELS_PER_SEASON} levels — level up by earning XP in-game (mining, fighting, smelting, anything that gives you XP).`,
        `Log in for the first time this season for a big bonus, then every day for a smaller one.`,
        `Progress shows in chat and as a brief on-screen readout when you gain XP — no permanent HUD.`,
      ].join('\n'),
      color: def.color,
      footer: { text: `Runs ${fmtDate(startDate)} → ${fmtDate(endDate)}` },
    }],
  }
}

function portalEventBody(season) {
  const { def, startDate, endDate } = season
  return [
    `**${def.theme}**`,
    '',
    `The ${def.name} Battlepass has begun! ${LEVELS_PER_SEASON} levels, unlocked by earning XP in-game.`,
    '',
    `- First login this season: a big bonus`,
    `- Every day you log in: a smaller bonus`,
    `- Every level: a themed reward — food and materials early on, high-end armor and rare materials at the top`,
    '',
    `Runs ${fmtDate(startDate)} through ${fmtDate(endDate)}.`,
  ].join('\n')
}

export async function checkAndAnnounce() {
  const season = currentSeason()
  const state = await loadState('announced')

  if (state.lastAnnouncedKey === season.key) {
    return // already announced this season
  }

  log(`new season detected: ${season.key} (${season.def.name}) — announcing`)

  const results = { fluxer: null, portal: null }

  if (config.fluxer.webhookUrl) {
    try {
      await postWebhook(fluxerEmbed(season))
      results.fluxer = 'ok'
    } catch (err) {
      results.fluxer = `FAILED: ${err.message}`
      log('fluxer announce failed:', err.message)
    }
  }

  if (config.portal.baseUrl && config.portal.ingestToken) {
    try {
      await postPortalEvent({
        title: `${season.def.emoji} ${season.def.name} Battlepass`,
        body: portalEventBody(season),
        startsAt: season.startDate.toISOString(),
        endsAt: season.endDate.toISOString(),
        location: 'Minecraft Server',
      })
      results.portal = 'ok'
    } catch (err) {
      results.portal = `FAILED: ${err.message}`
      log('portal announce failed:', err.message)
    }
  }

  // Only mark as announced if at least one side actually succeeded (or
  // neither was configured) — a transient failure on both should retry
  // on the next tick rather than silently going quiet for the season.
  const anyConfigured = !!config.fluxer.webhookUrl || !!(config.portal.baseUrl && config.portal.ingestToken)
  const anyFailed = results.fluxer?.startsWith('FAILED') || results.portal?.startsWith('FAILED')
  if (!anyConfigured || !anyFailed) {
    await saveState('announced', { lastAnnouncedKey: season.key, announcedAt: new Date().toISOString(), results })
  } else {
    log('will retry announcement next tick (at least one side failed)')
  }
}
