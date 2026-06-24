import { Group, Match, Team } from '../types'

const SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260627'
const STANDINGS_URL =
  'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings'

// ESPN display names → our canonical names (handles any divergences)
const ESPN_NAME_MAP: Record<string, string> = {
  'Bosnia and Herzegovina': 'Bosnia-Herzegovina',
  'Congo DR': 'DR Congo',
  'Cote d\'Ivoire': 'Ivory Coast',
  "Côte d'Ivoire": 'Ivory Coast',
  'Turkey': 'Türkiye',
  'Curacao': 'Curaçao',
}

function normalizeName(name: string): string {
  return ESPN_NAME_MAP[name] ?? name
}

export interface ESPNStandingsGroup {
  id: string        // 'A' through 'L'
  entries: ESPNStandingsEntry[]
}

export interface ESPNStandingsEntry {
  teamName: string
  teamAbbr: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  advancementNote: string
}

export interface MatchEvent {
  minute: string          // "9'", "45'+2'"
  type: 'goal' | 'own_goal' | 'penalty' | 'yellow' | 'red'
  player: string          // "J. Quiñones"
  side: 'home' | 'away'
}

export interface TeamMatchStats {
  possession: number      // 0–100
  shotsOnTarget: number
  totalShots: number
  corners: number
  fouls: number
  shotAssists: number     // key passes that led to a shot
}

export interface ESPNMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  played: boolean
  status: string   // 'pre' | 'in' | 'post'
  displayClock: string
  statusDetail: string  // e.g. "Half Time", "In Progress"
  venue: string         // e.g. "SoFi Stadium"
  events: MatchEvent[]
  homeStats: TeamMatchStats | null
  awayStats: TeamMatchStats | null
  homeColor: string  // e.g. "#006847"
  awayColor: string
}

function statValue(stats: { name: string; value: number }[], name: string): number {
  return stats.find(s => s.name === name)?.value ?? 0
}

export async function fetchStandings(): Promise<ESPNStandingsGroup[]> {
  const res = await fetch(STANDINGS_URL)
  if (!res.ok) throw new Error(`ESPN standings ${res.status}`)
  const data = await res.json()

  return (data.children ?? []).map((child: any) => {
    const groupName: string = child.name ?? ''           // "Group A"
    const groupId = groupName.replace('Group ', '').trim()
    const entries: any[] = child.standings?.entries ?? []

    return {
      id: groupId,
      entries: entries.map((e: any) => {
        const stats: { name: string; value: number }[] = e.stats ?? []
        const gf = statValue(stats, 'pointsFor')
        const ga = statValue(stats, 'pointsAgainst')
        return {
          teamName: normalizeName(e.team?.displayName ?? ''),
          teamAbbr: e.team?.abbreviation ?? '',
          played: statValue(stats, 'gamesPlayed'),
          won: statValue(stats, 'wins'),
          drawn: statValue(stats, 'ties'),
          lost: statValue(stats, 'losses'),
          goalsFor: gf,
          goalsAgainst: ga,
          goalDifference: gf - ga,
          points: statValue(stats, 'points'),
          advancementNote: e.note?.description ?? '',
        }
      }),
    }
  })
}

export async function fetchScoreboard(): Promise<ESPNMatch[]> {
  const res = await fetch(SCOREBOARD_URL)
  if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}`)
  const data = await res.json()

  return (data.events ?? []).map((event: any) => {
    const comp = event.competitions?.[0]
    const competitors: any[] = comp?.competitors ?? []
    const home = competitors.find((c: any) => c.homeAway === 'home')
    const away = competitors.find((c: any) => c.homeAway === 'away')
    const statusType = comp?.status?.type ?? {}
    const completed = statusType.completed ?? false
    const state: string = statusType.state ?? 'pre'

    const homeScore = home?.score != null && home.score !== '' ? parseInt(home.score) : null
    const awayScore = away?.score != null && away.score !== '' ? parseInt(away.score) : null

    const isLive = state === 'in'

    // Build a team-ID → side map so details can be attributed home/away
    const homeId: string = home?.id ?? ''
    const sideOf = (teamId: string): 'home' | 'away' => teamId === homeId ? 'home' : 'away'

    // Parse match events (goals, cards) from the details array
    const details: any[] = comp?.details ?? []
    const events: MatchEvent[] = details
      .filter((d: any) => d.scoringPlay || d.yellowCard || d.redCard)
      .map((d: any) => {
        const player = d.athletesInvolved?.[0]?.shortName ?? ''
        const side = sideOf(d.team?.id ?? '')
        let type: MatchEvent['type'] = 'goal'
        if (d.ownGoal) type = 'own_goal'
        else if (d.penaltyKick && d.scoringPlay) type = 'penalty'
        else if (d.redCard) type = 'red'
        else if (d.yellowCard) type = 'yellow'
        return { minute: d.clock?.displayValue ?? '', type, player, side }
      })

    // Parse per-team stats
    function parseStats(competitor: any): TeamMatchStats | null {
      if (!competitor) return null
      const s: any[] = competitor.statistics ?? []
      const sv = (name: string) => parseFloat(s.find((x: any) => x.name === name)?.displayValue ?? '0') || 0
      return {
        possession: sv('possessionPct'),
        shotsOnTarget: sv('shotsOnTarget'),
        totalShots: sv('totalShots'),
        corners: sv('wonCorners'),
        fouls: sv('foulsCommitted'),
        shotAssists: sv('shotAssists'),
      }
    }

    return {
      id: event.id,
      homeTeam: normalizeName(home?.team?.displayName ?? ''),
      awayTeam: normalizeName(away?.team?.displayName ?? ''),
      homeScore: completed || isLive ? homeScore : null,
      awayScore: completed || isLive ? awayScore : null,
      played: completed,
      status: state,
      displayClock: comp?.status?.displayClock ?? '',
      statusDetail: comp?.status?.type?.detail ?? comp?.status?.type?.description ?? '',
      venue: comp?.venue?.fullName ?? '',
      events,
      homeStats: parseStats(home),
      awayStats: parseStats(away),
      homeColor: home?.team?.color ? `#${home.team.color}` : '#888888',
      awayColor: away?.team?.color ? `#${away.team.color}` : '#888888',
    }
  })
}
