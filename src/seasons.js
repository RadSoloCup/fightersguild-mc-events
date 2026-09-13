// Season identity + schedule ONLY — no reward data here. The actual reward
// items/levels live inline in the Minecraft server's KubeJS script
// (kubejs/server_scripts/battlepass.js) because KubeJS's sandbox blocks all
// file I/O, so that script can't read a shared config file. This rotation
// (names, themes, anchor date) is kept in sync with that script BY HAND —
// if you add/reorder a season here, do the same there.
// Season 0 is actually two named sub-phases in-game (battlepass.js splits it
// at phaseSplitDay: 48 — Night of the Living Dead, then A Very Rad Xmas).
// This announcer only ever sends one launch message per season, so both
// phase names are folded into one entry here rather than fully modeling
// phases on this side.
export const ROTATION = [
  { name: 'Night of the Living Dead → A Very Rad Xmas', theme: 'Halloween zombie hordes & pumpkins, then a snowy Christmas', emoji: '🎃', color: 0xff7518 },
  { name: "New Year's Frost", theme: "New Year → Valentine's", emoji: '❄️', color: 0x4fc3f7 },
  { name: 'Bloom & Renewal', theme: 'Easter → Summer', emoji: '🌸', color: 0xe685d6 },
  { name: 'Harvest Festival', theme: 'Summer → Back to School', emoji: '☀️', color: 0xffc107 },
]

export const ANCHOR_DATE = '2026-09-13'
export const LEVELS_PER_SEASON = 30

function monthsBetween(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
}
function addMonths(d, n) {
  const r = new Date(d.getTime())
  r.setMonth(r.getMonth() + n)
  return r
}

// Mirrors the season math in battlepass.js — same anchor, same 3-month
// cycle, same ever-increasing season number so a rotation slot repeating a
// year later still counts as a distinct season.
export function currentSeason(now = new Date()) {
  const anchor = new Date(ANCHOR_DATE + 'T00:00:00Z')
  const months = monthsBetween(anchor, now)
  const seasonNumber = Math.max(0, Math.floor(months / 3))
  const rotationIndex = seasonNumber % ROTATION.length
  const def = ROTATION[rotationIndex]
  const startDate = addMonths(anchor, seasonNumber * 3)
  const endDate = addMonths(anchor, (seasonNumber + 1) * 3)
  return { key: `S${seasonNumber}`, seasonNumber, def, startDate, endDate }
}
