export interface Team {
  name: string
  flag: string
}

export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  played: boolean
  clock?: string        // e.g. "66'" when live, cleared when finished
  statusDetail?: string // e.g. "Half Time", "In Progress"
  venue?: string        // e.g. "SoFi Stadium"
  events?: import('./services/espn').MatchEvent[]
  homeStats?: import('./services/espn').TeamMatchStats | null
  awayStats?: import('./services/espn').TeamMatchStats | null
  homeColor?: string  // e.g. "#006847" from ESPN team data
  awayColor?: string
}

export interface Group {
  id: string // 'A' through 'L'
  teams: Team[]
  matches: Match[]
}

export interface TeamStanding {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface KnockoutTeam {
  name: string
  flag: string
  group: string
  position: 1 | 2 | 3 // 1=winner, 2=runner-up, 3=third
  locked?: boolean // true when the team's slot is definitively confirmed
}

export interface KnockoutMatch {
  id: number
  round: 'R32' | 'R16' | 'QF' | 'SF' | 'Final' | '3rd'
  homeTeam: KnockoutTeam | null
  awayTeam: KnockoutTeam | null
  homeScore: number | null
  awayScore: number | null
  played: boolean
  date: string
  venue: string
  isUserMatch?: boolean // true for M74
}
