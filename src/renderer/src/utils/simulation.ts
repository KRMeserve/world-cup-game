import { Group, Match } from '../types'
import { computeStandings, isMathEliminated } from './standings'
import { TeamStanding } from '../types'
import { getMatch74Group } from './bracket'

const N_SIMS = 10_000

// ── FIFA World Rankings (approximate, as of tournament start) ─────────────
// Used as the Bradley-Terry strength weights: strength = 1 / rank.
// Lower rank number = stronger team.
// Source: FIFA World Rankings as of June 11, 2026
export const FIFA_RANKINGS: Record<string, number> = {
  'Argentina':          1,
  'Spain':              2,
  'France':             3,
  'England':            4,
  'Portugal':           5,
  'Brazil':             6,
  'Morocco':            7,
  'Netherlands':        8,
  'Belgium':            9,
  'Germany':           10,
  'Croatia':           11,
  'Colombia':          13,
  'Mexico':            14,
  'Senegal':           15,
  'Uruguay':           16,
  'United States':     17,
  'Japan':             18,
  'Switzerland':       19,
  'Iran':              20,
  'Türkiye':           22,
  'Ecuador':           23,
  'Austria':           24,
  'South Korea':       25,
  'Australia':         27,
  'Algeria':           28,
  'Egypt':             29,
  'Canada':            30,
  'Norway':            31,
  'Ivory Coast':       33,
  'Panama':            34,
  'Sweden':            38,
  'Czechia':           40,
  'Paraguay':          41,
  'Scotland':          42,
  'Tunisia':           45,
  'DR Congo':          46,
  'Uzbekistan':        50,
  'Qatar':             56,
  'Iraq':              57,
  'South Africa':      60,
  'Saudi Arabia':      61,
  'Jordan':            63,
  'Bosnia-Herzegovina':64,
  'Cape Verde':        67,
  'Ghana':             73,
  'Curaçao':           82,
  'Haiti':             83,
  'New Zealand':       85,
}

// ── Realistic scoreline distributions ────────────────────
// Weighted by real-world World Cup goal frequencies.
// Used for wins — draw scores are separate.
// Format: [winner goals, loser goals]
const WIN_SCORES: [number, number][] = [
  [1, 0], [1, 0], [1, 0],  // 1-0: ~28%
  [2, 1], [2, 1], [2, 1],  // 2-1: ~22%
  [2, 0], [2, 0],           // 2-0: ~17%
  [3, 1], [3, 1],           // 3-1: ~12%
  [3, 0],                   // 3-0: ~9%
  [3, 2],                   // 3-2: ~5%
  [4, 0],                   // 4-0: ~4%
  [4, 1],                   // 4-1: ~3%
]
const DRAW_SCORES: [number, number][] = [
  [0, 0], [0, 0], [0, 0],  // 0-0: ~45%
  [1, 1], [1, 1], [1, 1],  // 1-1: ~42%
  [2, 2],                   // 2-2: ~10%
  [3, 3],                   // 3-3: ~3%
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Match result simulation ───────────────────────────────
// Win/draw/loss probabilities derived from FIFA rankings via a Bradley-Terry
// model: strength = 1/rank, P(home wins) = awayRank / (homeRank + awayRank).
// Draw probability peaks at 27% for evenly-matched teams and falls off as the
// mismatch grows (blowouts rarely end in draws). Scorelines are drawn from
// realistic distributions so GD tiebreakers are meaningfully simulated.
function matchProbabilities(homeTeam: string, awayTeam: string): { home: number; draw: number; away: number } {
  const hr = FIFA_RANKINGS[homeTeam] ?? 60  // default to mid-table if unknown
  const ar = FIFA_RANKINGS[awayTeam] ?? 60
  // Bradley-Terry expected score for home team
  const pHomeExpected = ar / (ar + hr)
  // Draw is most likely when teams are evenly matched
  const mismatch = Math.abs(pHomeExpected - 0.5) * 2  // 0 = equal, 1 = total mismatch
  const pDraw = 0.27 * (1 - 0.6 * mismatch)
  return {
    home: pHomeExpected * (1 - pDraw),
    draw: pDraw,
    away: (1 - pHomeExpected) * (1 - pDraw),
  }
}

function simulateMatch(match: Match): Match {
  if (match.played) return match
  // In-progress match: use the live score rather than randomizing, consistent
  // with how computeStandings counts them in the group tables.
  if (match.homeScore !== null && match.awayScore !== null) {
    return { ...match, played: true }
  }
  const { home, draw } = matchProbabilities(match.homeTeam, match.awayTeam)
  const r = Math.random()
  if (r < home) {
    const [w, l] = pickRandom(WIN_SCORES)
    return { ...match, homeScore: w, awayScore: l, played: true }
  }
  if (r < home + draw) {
    const [s] = pickRandom(DRAW_SCORES)
    return { ...match, homeScore: s, awayScore: s, played: true }
  }
  const [w, l] = pickRandom(WIN_SCORES)
  return { ...match, homeScore: l, awayScore: w, played: true }
}

function simulateGroup(group: Group): TeamStanding[] {
  const simMatches = group.matches.map(simulateMatch)
  return computeStandings({ ...group, matches: simMatches })
}

// Rank two third-place standings across groups (for best-8 qualification)
function compareThirdPlace(a: TeamStanding, b: TeamStanding): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
  return b.goalsFor - a.goalsFor
}

// ── Pre-game win probability ──────────────────────────────
// Returns win/draw/loss odds for a specific upcoming match, blending:
//   • Base Bradley-Terry strength from FIFA rankings
//   • Form adjustment from actual vs expected points in played tournament matches
//     (weighted 70/30 so a small sample doesn't over-correct)

function tournamentFormFactor(teamName: string, groups: Group[]): number {
  let totalActual = 0
  let totalExpected = 0

  for (const group of groups) {
    for (const match of group.matches) {
      if (!match.played || match.homeScore === null || match.awayScore === null) continue
      const isHome = match.homeTeam === teamName
      const isAway = match.awayTeam === teamName
      if (!isHome && !isAway) continue

      const { home: pHome, draw: pDraw, away: pAway } = matchProbabilities(match.homeTeam, match.awayTeam)
      const pWin = isHome ? pHome : pAway
      totalExpected += pWin * 3 + pDraw * 1

      const h = match.homeScore, a = match.awayScore
      const actualPts = isHome
        ? (h > a ? 3 : h === a ? 1 : 0)
        : (a > h ? 3 : a === h ? 1 : 0)
      totalActual += actualPts
    }
  }

  if (totalExpected === 0) return 1  // no games played — no adjustment
  // Blend: 70% neutral baseline + 30% actual/expected ratio
  return 0.7 + 0.3 * (totalActual / totalExpected)
}

export function pregameOdds(
  homeTeam: string,
  awayTeam: string,
  groups: Group[]
): { home: number; draw: number; away: number } {
  const hr = FIFA_RANKINGS[homeTeam] ?? 60
  const ar = FIFA_RANKINGS[awayTeam] ?? 60

  const homeForm = tournamentFormFactor(homeTeam, groups)
  const awayForm = tournamentFormFactor(awayTeam, groups)

  // Adjusted Bradley-Terry strength
  const homeStrength = (1 / hr) * homeForm
  const awayStrength = (1 / ar) * awayForm

  const pHomeExpected = homeStrength / (homeStrength + awayStrength)
  const mismatch = Math.abs(pHomeExpected - 0.5) * 2
  const pDraw = 0.27 * (1 - 0.6 * mismatch)

  return {
    home: pHomeExpected * (1 - pDraw),
    draw: pDraw,
    away: (1 - pHomeExpected) * (1 - pDraw),
  }
}

// ── Public types ──────────────────────────────────────────

export interface TeamOdds {
  teamName: string
  flag: string
  groupId: string
  probability: number // 0–1
}

export interface GroupPlacements {
  first: Record<string, number>   // teamName → P(finish 1st)
  second: Record<string, number>  // teamName → P(finish 2nd)
}

export interface SimulationResult {
  /** P(team finishes 1st in Group E) */
  groupEFirst: TeamOdds[]
  /**
   * P(team is the specific 3rd-place opponent in the Jun 29 match).
   * When multiple A/B/C/D/F teams qualify in the same simulation, probability
   * is split equally among them (we don't have the exact FIFA assignment table).
   */
  thirdPlaceCandidates: TeamOdds[]
  /** P(finish 1st or 2nd) for every group — used for bracket lock detection */
  groupPlacements: Record<string, GroupPlacements>
  /** How many simulations ran */
  iterations: number
}

// ── Core simulation ───────────────────────────────────────

export function runSimulation(groups: Group[]): SimulationResult {
  const groupEFirstCounts: Record<string, number> = {}
  const thirdQualifiedCounts: Record<string, number> = {}
  const groupFirstCounts: Record<string, Record<string, number>> = {}
  const groupSecondCounts: Record<string, Record<string, number>> = {}

  // Pre-compute teams mathematically eliminated from finishing 3rd in their group.
  // The simulation doesn't respect elimination (it randomly simulates remaining matches),
  // so we exclude these teams when selecting the 3rd-place representative per group.
  const eliminatedFrom3rd = new Set<string>()
  for (const g of groups) {
    const standings = computeStandings(g)
    for (let i = 3; i < standings.length; i++) {
      if (isMathEliminated(standings, i, g)) {
        eliminatedFrom3rd.add(standings[i].team.name)
      }
    }
  }

  // Initialise counters for every team
  for (const g of groups) {
    groupFirstCounts[g.id] = {}
    groupSecondCounts[g.id] = {}
    for (const t of g.teams) {
      if (g.id === 'E') groupEFirstCounts[t.name] = 0
      thirdQualifiedCounts[t.name] = 0
      groupFirstCounts[g.id][t.name] = 0
      groupSecondCounts[g.id][t.name] = 0
    }
  }

  for (let i = 0; i < N_SIMS; i++) {
    // Simulate all 12 groups
    const allResults: { groupId: string; standings: TeamStanding[] }[] = groups.map(g => ({
      groupId: g.id,
      standings: simulateGroup(g),
    }))

    // ── Group E 1st place ─────────────────────────────────
    const groupEResult = allResults.find(r => r.groupId === 'E')
    if (groupEResult) {
      const first = groupEResult.standings[0].team.name
      groupEFirstCounts[first] = (groupEFirstCounts[first] ?? 0) + 1
    }

    // ── 1st and 2nd place for all groups ──────────────────
    for (const { groupId, standings } of allResults) {
      if (standings.length >= 1) {
        const n = standings[0].team.name
        groupFirstCounts[groupId][n] = (groupFirstCounts[groupId][n] ?? 0) + 1
      }
      if (standings.length >= 2) {
        const n = standings[1].team.name
        groupSecondCounts[groupId][n] = (groupSecondCounts[groupId][n] ?? 0) + 1
      }
    }

    // ── Best-8 third-place qualification ──────────────────
    // Collect the 3rd-place team from each group, skipping mathematically
    // eliminated teams so they can't appear as 3rd-place in any simulation.
    const allThirds = allResults.map(r => {
      const eligible = r.standings.filter(s => !eliminatedFrom3rd.has(s.team.name))
      const third = eligible[2] ?? r.standings[2]
      return { groupId: r.groupId, teamName: third.team.name, standing: third }
    })

    // Sort all 12 by quality and take the best 8
    const ranked = [...allThirds].sort((a, b) => compareThirdPlace(a.standing, b.standing))
    const top8Names = new Set(ranked.slice(0, 8).map(x => x.teamName))

    // Use the official FIFA Annexe C lookup to determine exactly which 3rd-place team
    // faces the Group E winner in match 74.
    const top8Groups = ranked.slice(0, 8).map(x => x.groupId)
    const match74Group = getMatch74Group(top8Groups)
    if (match74Group) {
      const match74Team = allThirds.find(x => x.groupId === match74Group && top8Names.has(x.teamName))
      if (match74Team) {
        thirdQualifiedCounts[match74Team.teamName] = (thirdQualifiedCounts[match74Team.teamName] ?? 0) + 1
      }
    }
  }

  // ── Build output arrays ───────────────────────────────────
  const teamMeta: Record<string, { flag: string; groupId: string }> = {}
  for (const g of groups) {
    for (const t of g.teams) teamMeta[t.name] = { flag: t.flag, groupId: g.id }
  }

  const groupEFirst: TeamOdds[] = Object.entries(groupEFirstCounts)
    .map(([teamName, count]) => ({
      teamName,
      flag: teamMeta[teamName]?.flag ?? '',
      groupId: 'E',
      probability: count / N_SIMS,
    }))
    .sort((a, b) => b.probability - a.probability)

  const thirdPlaceCandidates: TeamOdds[] = Object.entries(thirdQualifiedCounts)
    .map(([teamName, count]) => ({
      teamName,
      flag: teamMeta[teamName]?.flag ?? '',
      groupId: teamMeta[teamName]?.groupId ?? '',
      probability: count / N_SIMS,
    }))
    .sort((a, b) => b.probability - a.probability)

  const groupPlacements: Record<string, GroupPlacements> = {}
  for (const g of groups) {
    const toProb = (counts: Record<string, number>) =>
      Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v / N_SIMS]))
    groupPlacements[g.id] = {
      first: toProb(groupFirstCounts[g.id]),
      second: toProb(groupSecondCounts[g.id]),
    }
  }

  return { groupEFirst, thirdPlaceCandidates, groupPlacements, iterations: N_SIMS }
}
