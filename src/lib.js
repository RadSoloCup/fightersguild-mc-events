import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { config } from './config.js'

export function log(...a) {
  console.log(new Date().toISOString(), ...a)
}

// Discord-wire-compatible webhook payload: { content?, username?, embeds? }.
export async function postWebhook(payload) {
  const res = await fetch(config.fluxer.webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': config.userAgent },
    body: JSON.stringify({ username: 'Battlepass', ...payload }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`POST webhook → ${res.status} ${body.slice(0, 200)}`)
  }
}

export async function postPortalEvent({ title, body, startsAt, endsAt, location }) {
  const res = await fetch(`${config.portal.baseUrl}/api/events/ingest`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.portal.ingestToken}`,
      'content-type': 'application/json',
      'user-agent': config.userAgent,
    },
    body: JSON.stringify({ title, body, startsAt, endsAt, location }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`POST portal event → ${res.status} ${t.slice(0, 200)}`)
  }
  return res.json()
}

// Tiny JSON key/value store, one file per key, under STATE_DIR.
export async function loadState(name) {
  try {
    return JSON.parse(await readFile(join(config.stateDir, `${name}.json`), 'utf8'))
  } catch {
    return {}
  }
}
export async function saveState(name, data) {
  const file = join(config.stateDir, `${name}.json`)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(data, null, 2))
}
