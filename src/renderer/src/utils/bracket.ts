import { Group, KnockoutTeam, KnockoutMatch } from '../types'
import { computeStandings, getClinched } from './standings'

// 3rd-place slot constraints: which groups' 3rd-place teams can fill each slot
const THIRD_PLACE_SLOTS: Record<number, string[]> = {
  74: ['A', 'B', 'C', 'D', 'F'],
  77: ['C', 'D', 'F', 'G', 'H'],
  79: ['C', 'E', 'F', 'H', 'I'],
  80: ['E', 'H', 'I', 'J', 'K'],
  81: ['B', 'E', 'F', 'I', 'J'],
  82: ['A', 'E', 'H', 'I', 'J'],
  85: ['E', 'F', 'G', 'I', 'J'],
  87: ['D', 'E', 'I', 'J', 'L'],
}

function rankThirdPlace(groups: Group[]): KnockoutTeam[] {
  const thirds: KnockoutTeam[] = []
  for (const g of groups) {
    const standings = computeStandings(g)
    if (standings.length >= 3) {
      const t = standings[2]
      thirds.push({
        name: t.team.name,
        flag: t.team.flag,
        group: g.id,
        position: 3,
      })
    }
  }
  // Sort by points → GD → GF
  thirds.sort((a, b) => {
    const sa = computeStandings(groups.find(g => g.id === a.group)!)[2]
    const sb = computeStandings(groups.find(g => g.id === b.group)!)[2]
    if (sb.points !== sa.points) return sb.points - sa.points
    if (sb.goalDifference !== sa.goalDifference) return sb.goalDifference - sa.goalDifference
    return sb.goalsFor - sa.goalsFor
  })
  return thirds
}

function assignThirdPlaceTeams(ranked: KnockoutTeam[]): Map<number, KnockoutTeam> {
  const top8 = ranked.slice(0, 8)
  const slotIds = Object.keys(THIRD_PLACE_SLOTS).map(Number)
  const result = new Map<number, KnockoutTeam>()

  function backtrack(slotIdx: number, usedTeamIndices: Set<number>): boolean {
    if (slotIdx === slotIds.length) return true
    const slotId = slotIds[slotIdx]
    const allowed = THIRD_PLACE_SLOTS[slotId]
    for (let i = 0; i < top8.length; i++) {
      if (usedTeamIndices.has(i)) continue
      if (allowed.includes(top8[i].group)) {
        result.set(slotId, top8[i])
        usedTeamIndices.add(i)
        if (backtrack(slotIdx + 1, usedTeamIndices)) return true
        result.delete(slotId)
        usedTeamIndices.delete(i)
      }
    }
    return false
  }

  backtrack(0, new Set())
  return result
}

interface ScoreEntry {
  homeScore: number
  awayScore: number
  played: boolean
}

function getWinner(matchId: number, scores: Record<number, ScoreEntry>, matchMap: Map<number, KnockoutMatch>): KnockoutTeam | null {
  const score = scores[matchId]
  if (!score || score.homeScore === null || score.awayScore === null) return null
  const match = matchMap.get(matchId)
  if (!match) return null
  // A winner from a played knockout match is always locked in
  if (score.homeScore > score.awayScore) return match.homeTeam ? { ...match.homeTeam, locked: true } : null
  if (score.awayScore > score.homeScore) return match.awayTeam ? { ...match.awayTeam, locked: true } : null
  return null
}

function getLoser(matchId: number, scores: Record<number, ScoreEntry>, matchMap: Map<number, KnockoutMatch>): KnockoutTeam | null {
  const score = scores[matchId]
  if (!score || score.homeScore === null || score.awayScore === null) return null
  const match = matchMap.get(matchId)
  if (!match) return null
  if (score.homeScore > score.awayScore) return match.awayTeam
  if (score.awayScore > score.homeScore) return match.homeTeam
  return null
}

export function resolveBracket(
  groups: Group[],
  scores: Record<number, ScoreEntry>
): KnockoutMatch[] {
  // 3rd-place slots only lock once every group is fully played (global ranking finalised)
  const allGroupsDone = groups.every(g => g.matches.every(m => m.played))

  // Extract 1st and 2nd place from each group, locked via simulation threshold
  const pos1 = new Map<string, KnockoutTeam>()
  const pos2 = new Map<string, KnockoutTeam>()

  for (const g of groups) {
    const standings = computeStandings(g)
    if (standings.length >= 1) {
      const t = standings[0]
      pos1.set(g.id, { name: t.team.name, flag: t.team.flag, group: g.id, position: 1, locked: getClinched(standings, 0, g) === 1 })
    }
    if (standings.length >= 2) {
      const t = standings[1]
      pos2.set(g.id, { name: t.team.name, flag: t.team.flag, group: g.id, position: 2, locked: getClinched(standings, 1, g) === 2 })
    }
  }

  const ranked3rd = rankThirdPlace(groups)
  const thirdRaw = assignThirdPlaceTeams(ranked3rd)
  // 3rd-place slots are locked only when all groups are done (global ranking is finalized)
  const third = new Map<number, KnockoutTeam>()
  for (const [slotId, team] of thirdRaw) {
    third.set(slotId, { ...team, locked: allGroupsDone })
  }

  // Build R32 matches
  const r32: KnockoutMatch[] = [
    { id: 73, round: 'R32', homeTeam: pos2.get('A') ?? null, awayTeam: pos2.get('B') ?? null, homeScore: null, awayScore: null, played: false, date: 'Jun 28 · 4:00 PM ET', venue: 'SoFi Stadium' },
    { id: 74, round: 'R32', homeTeam: pos1.get('E') ?? null, awayTeam: third.get(74) ?? null, homeScore: null, awayScore: null, played: false, date: 'Jun 29 · 4:30 PM ET', venue: 'Gillette Stadium', isUserMatch: true },
    { id: 75, round: 'R32', homeTeam: pos1.get('F') ?? null, awayTeam: pos2.get('C') ?? null, homeScore: null, awayScore: null, played: false, date: 'Jun 29 · 8:00 PM ET', venue: 'AT&T Stadium' },
    { id: 76, round: 'R32', homeTeam: pos1.get('C') ?? null, awayTeam: pos2.get('F') ?? null, homeScore: null, awayScore: null, played: false, date: 'Jun 29 · 12:00 PM ET', venue: 'Mercedes-Benz Stadium' },
    { id: 77, round: 'R32', homeTeam: pos1.get('I') ?? null, awayTeam: third.get(77) ?? null, homeScore: null, awayScore: null, played: false, date: 'Jun 30 · 4:00 PM ET', venue: 'Arrowhead Stadium' },
    { id: 78, round: 'R32', homeTeam: pos2.get('E') ?? null, awayTeam: pos2.get('I') ?? null, homeScore: null, awayScore: null, played: false, date: 'Jun 30 · 8:00 PM ET', venue: 'Estadio Azteca' },
    { id: 79, round: 'R32', homeTeam: pos1.get('A') ?? null, awayTeam: third.get(79) ?? null, homeScore: null, awayScore: null, played: false, date: 'Jun 30 · 12:00 PM ET', venue: 'Rose Bowl' },
    { id: 80, round: 'R32', homeTeam: pos1.get('L') ?? null, awayTeam: third.get(80) ?? null, homeScore: null, awayScore: null, played: false, date: 'Jul 1 · 4:00 PM ET', venue: 'Lumen Field' },
    { id: 81, round: 'R32', homeTeam: pos1.get('D') ?? null, awayTeam: third.get(81) ?? null, homeScore: null, awayScore: null, played: false, date: 'Jul 1 · 8:00 PM ET', venue: 'Allegiant Stadium' },
    { id: 82, round: 'R32', homeTeam: pos1.get('G') ?? null, awayTeam: third.get(82) ?? null, homeScore: null, awayScore: null, played: false, date: 'Jul 1 · 12:00 PM ET', venue: 'Hard Rock Stadium' },
    { id: 83, round: 'R32', homeTeam: pos2.get('K') ?? null, awayTeam: pos2.get('L') ?? null, homeScore: null, awayScore: null, played: false, date: 'Jul 2 · 4:00 PM ET', venue: 'MetLife Stadium' },
    { id: 84, round: 'R32', homeTeam: pos1.get('H') ?? null, awayTeam: pos2.get('J') ?? null, homeScore: null, awayScore: null, played: false, date: 'Jul 2 · 8:00 PM ET', venue: 'BC Place' },
    { id: 85, round: 'R32', homeTeam: pos1.get('B') ?? null, awayTeam: third.get(85) ?? null, homeScore: null, awayScore: null, played: false, date: 'Jul 2 · 12:00 PM ET', venue: 'BMO Field' },
    { id: 86, round: 'R32', homeTeam: pos1.get('J') ?? null, awayTeam: pos2.get('H') ?? null, homeScore: null, awayScore: null, played: false, date: 'Jul 3 · 4:00 PM ET', venue: 'NRG Stadium' },
    { id: 87, round: 'R32', homeTeam: pos1.get('K') ?? null, awayTeam: third.get(87) ?? null, homeScore: null, awayScore: null, played: false, date: 'Jul 3 · 8:00 PM ET', venue: 'Lincoln Financial Field' },
    { id: 88, round: 'R32', homeTeam: pos2.get('D') ?? null, awayTeam: pos2.get('G') ?? null, homeScore: null, awayScore: null, played: false, date: 'Jul 3 · 12:00 PM ET', venue: 'Estadio Guadalajara' },
  ]

  // Apply scores to R32
  const matchMap = new Map<number, KnockoutMatch>()
  for (const m of r32) {
    const s = scores[m.id]
    if (s) {
      matchMap.set(m.id, { ...m, homeScore: s.homeScore, awayScore: s.awayScore, played: s.played })
    } else {
      matchMap.set(m.id, m)
    }
  }

  // Build R16
  const r16Defs: Array<{ id: number; home: number; away: number; date: string; venue: string }> = [
    { id: 89, home: 74, away: 77, date: 'Jul 4 · 4:00 PM ET',  venue: 'SoFi Stadium' },
    { id: 90, home: 73, away: 75, date: 'Jul 4 · 8:00 PM ET',  venue: 'Levi\'s Stadium' },
    { id: 91, home: 76, away: 78, date: 'Jul 5 · 4:00 PM ET',  venue: 'Rose Bowl' },
    { id: 92, home: 79, away: 80, date: 'Jul 5 · 8:00 PM ET',  venue: 'Hard Rock Stadium' },
    { id: 93, home: 83, away: 84, date: 'Jul 6 · 4:00 PM ET',  venue: 'AT&T Stadium' },
    { id: 94, home: 81, away: 82, date: 'Jul 6 · 8:00 PM ET',  venue: 'Allegiant Stadium' },
    { id: 95, home: 86, away: 88, date: 'Jul 7 · 4:00 PM ET',  venue: 'Arrowhead Stadium' },
    { id: 96, home: 85, away: 87, date: 'Jul 7 · 8:00 PM ET',  venue: 'MetLife Stadium' },
  ]

  for (const def of r16Defs) {
    const homeTeam = getWinner(def.home, scores, matchMap)
    const awayTeam = getWinner(def.away, scores, matchMap)
    const s = scores[def.id]
    const m: KnockoutMatch = {
      id: def.id,
      round: 'R16',
      homeTeam,
      awayTeam,
      homeScore: s?.homeScore ?? null,
      awayScore: s?.awayScore ?? null,
      played: s?.played ?? false,
      date: def.date,
      venue: def.venue,
    }
    matchMap.set(def.id, m)
  }

  // Build QF
  const qfDefs: Array<{ id: number; home: number; away: number; date: string; venue: string }> = [
    { id: 97,  home: 89, away: 90, date: 'Jul 9 · 4:00 PM ET',  venue: 'Gillette Stadium' },
    { id: 98,  home: 93, away: 94, date: 'Jul 9 · 8:00 PM ET',  venue: 'SoFi Stadium' },
    { id: 99,  home: 91, away: 92, date: 'Jul 10 · 8:00 PM ET', venue: 'Hard Rock Stadium' },
    { id: 100, home: 95, away: 96, date: 'Jul 11 · 8:00 PM ET', venue: 'AT&T Stadium' },
  ]

  for (const def of qfDefs) {
    const homeTeam = getWinner(def.home, scores, matchMap)
    const awayTeam = getWinner(def.away, scores, matchMap)
    const s = scores[def.id]
    const m: KnockoutMatch = {
      id: def.id,
      round: 'QF',
      homeTeam,
      awayTeam,
      homeScore: s?.homeScore ?? null,
      awayScore: s?.awayScore ?? null,
      played: s?.played ?? false,
      date: def.date,
      venue: def.venue,
    }
    matchMap.set(def.id, m)
  }

  // Build SF
  const sfDefs: Array<{ id: number; home: number; away: number; date: string; venue: string }> = [
    { id: 101, home: 97,  away: 98,  date: 'Jul 14 · 3:00 PM ET', venue: 'AT&T Stadium' },
    { id: 102, home: 99,  away: 100, date: 'Jul 15 · 3:00 PM ET', venue: 'Mercedes-Benz Stadium' },
  ]

  for (const def of sfDefs) {
    const homeTeam = getWinner(def.home, scores, matchMap)
    const awayTeam = getWinner(def.away, scores, matchMap)
    const s = scores[def.id]
    const m: KnockoutMatch = {
      id: def.id,
      round: 'SF',
      homeTeam,
      awayTeam,
      homeScore: s?.homeScore ?? null,
      awayScore: s?.awayScore ?? null,
      played: s?.played ?? false,
      date: def.date,
      venue: def.venue,
    }
    matchMap.set(def.id, m)
  }

  // 3rd place
  {
    const s = scores[103]
    const m: KnockoutMatch = {
      id: 103,
      round: '3rd',
      homeTeam: getLoser(101, scores, matchMap),
      awayTeam: getLoser(102, scores, matchMap),
      homeScore: s?.homeScore ?? null,
      awayScore: s?.awayScore ?? null,
      played: s?.played ?? false,
      date: 'Jul 18 · 5:00 PM ET',
      venue: 'Hard Rock Stadium',
    }
    matchMap.set(103, m)
  }

  // Final
  {
    const s = scores[104]
    const m: KnockoutMatch = {
      id: 104,
      round: 'Final',
      homeTeam: getWinner(101, scores, matchMap),
      awayTeam: getWinner(102, scores, matchMap),
      homeScore: s?.homeScore ?? null,
      awayScore: s?.awayScore ?? null,
      played: s?.played ?? false,
      date: 'Jul 19 · 3:00 PM ET',
      venue: 'MetLife Stadium',
    }
    matchMap.set(104, m)
  }

  return Array.from(matchMap.values())
}
