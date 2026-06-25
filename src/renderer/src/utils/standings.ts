import { Group, TeamStanding } from '../types'

/** Returns the set of team names currently in a live (in-progress) match. */
export function getLiveTeams(group: Group): Set<string> {
  const live = new Set<string>()
  for (const m of group.matches) {
    if (!m.played && m.homeScore !== null && m.awayScore !== null) {
      live.add(m.homeTeam)
      live.add(m.awayTeam)
    }
  }
  return live
}

export function computeStandings(group: Group): TeamStanding[] {
  const map = new Map<string, TeamStanding>()

  for (const team of group.teams) {
    map.set(team.name, {
      team,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
    })
  }

  for (const match of group.matches) {
    // Count both completed matches and in-progress ones (scores present but not yet marked played)
    const hasScores = match.homeScore !== null && match.awayScore !== null
    if (!hasScores) continue
    const home = map.get(match.homeTeam)!
    const away = map.get(match.awayTeam)!

    home.played++; away.played++
    home.goalsFor += match.homeScore; home.goalsAgainst += match.awayScore
    away.goalsFor += match.awayScore; away.goalsAgainst += match.homeScore

    if (match.homeScore > match.awayScore) {
      home.won++; home.points += 3; away.lost++
    } else if (match.homeScore < match.awayScore) {
      away.won++; away.points += 3; home.lost++
    } else {
      home.drawn++; home.points++; away.drawn++; away.points++
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst
    away.goalDifference = away.goalsFor - away.goalsAgainst
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })
}

export function isMathEliminated(standings: TeamStanding[], idx: number, group: Group): boolean {
  if (idx < 3) return false

  const team = standings[idx]
  const third = standings[2]
  const remaining = gamesRemaining(group, team.team.name)
  const maxPts = team.points + 3 * remaining

  if (maxPts < third.points) return true

  if (maxPts === third.points) {
    const gdGap = third.goalDifference - team.goalDifference
    if (gdGap > 10 * remaining) return true

    const h2h = group.matches.find(m =>
      m.played && m.homeScore !== null && m.awayScore !== null && (
        (m.homeTeam === team.team.name && m.awayTeam === third.team.name) ||
        (m.homeTeam === third.team.name && m.awayTeam === team.team.name)
      )
    )
    if (h2h) {
      const teamIsHome = h2h.homeTeam === team.team.name
      const teamGoals = teamIsHome ? h2h.homeScore! : h2h.awayScore!
      const thirdGoals = teamIsHome ? h2h.awayScore! : h2h.homeScore!
      if (teamGoals < thirdGoals && gdGap >= 0) return true
    }
  }

  return false
}

export function gamesRemaining(group: Group, teamName: string): number {
  return group.matches.filter(
    m => !m.played && m.homeScore === null && (m.homeTeam === teamName || m.awayTeam === teamName)
  ).length
}

/**
 * Returns the position (1, 2, or 3) the team has mathematically clinched,
 * or null if not yet decided.
 *
 * A position is clinched when no team below can mathematically reach their
 * points total, accounting for GD and H2H tiebreakers when points could tie.
 */
export function getClinched(standings: TeamStanding[], idx: number, group: Group): 1 | 2 | 3 | null {
  if (idx > 2) return null

  const team = standings[idx]
  const remaining = gamesRemaining(group, team.team.name)
  const maxPts = team.points + 3 * remaining

  // Can't rise: check whether this team could still overtake any team above them
  for (let i = 0; i < idx; i++) {
    const above = standings[i]
    if (maxPts > above.points) return null  // can surpass on points

    if (maxPts === above.points) {
      // Tied on max points — check if tiebreakers could still go in team's favour
      const gdGap = above.goalDifference - team.goalDifference  // positive means above is ahead
      if (gdGap <= 10 * remaining) {
        // GD gap is bridgeable; check H2H
        const h2h = group.matches.find(m =>
          m.played && m.homeScore !== null && m.awayScore !== null && (
            (m.homeTeam === team.team.name && m.awayTeam === above.team.name) ||
            (m.homeTeam === above.team.name && m.awayTeam === team.team.name)
          )
        )
        if (!h2h) return null  // no H2H played yet — outcome unknown
        const teamIsHome = h2h.homeTeam === team.team.name
        const teamGoals = teamIsHome ? h2h.homeScore! : h2h.awayScore!
        const aboveGoals = teamIsHome ? h2h.awayScore! : h2h.homeScore!
        if (teamGoals >= aboveGoals) return null  // team won or drew H2H — could rise
        // Team lost H2H and GD gap is bridgeable — above team stays ahead, continue
      }
      // else: GD gap is insurmountable — team cannot overtake on tiebreakers, continue
    }
    // maxPts < above.points: can't reach them at all — continue
  }

  // Can't fall: no team below can reach this team's points (with tiebreaker checks)
  const below = standings.slice(idx + 1)

  for (const other of below) {
    const otherMax = other.points + 3 * gamesRemaining(group, other.team.name)

    if (otherMax > team.points) return null

    if (otherMax === team.points) {
      const gdGap = team.goalDifference - other.goalDifference
      const otherRemaining = gamesRemaining(group, other.team.name)
      if (gdGap <= 10 * otherRemaining) {
        const h2h = group.matches.find(m =>
          m.played && m.homeScore !== null && m.awayScore !== null && (
            (m.homeTeam === team.team.name && m.awayTeam === other.team.name) ||
            (m.homeTeam === other.team.name && m.awayTeam === team.team.name)
          )
        )
        if (h2h) {
          const teamIsHome = h2h.homeTeam === team.team.name
          const teamGoals = teamIsHome ? h2h.homeScore! : h2h.awayScore!
          const otherGoals = teamIsHome ? h2h.awayScore! : h2h.homeScore!
          if (teamGoals <= otherGoals) return null
        } else {
          return null
        }
      }
    }
  }

  return (idx + 1) as 1 | 2 | 3
}

export interface Implication {
  message: string
  isCurrent: boolean
}

/** What each result outcome means for the two teams in a live match. */
export function getMatchImplications(group: Group, matchId: string, liveHomeScore: number, liveAwayScore: number): Implication[] {
  const match = group.matches.find(m => m.id === matchId)
  if (!match) return []

  const { homeTeam, awayTeam } = match

  const withOutcome = (hs: number, as_: number): Group => ({
    ...group,
    matches: group.matches.map(m =>
      m.id === matchId ? { ...m, homeScore: hs, awayScore: as_, played: true } : m
    ),
  })

  // Baseline: match hasn't happened yet (strip live scores)
  const baseGroup: Group = {
    ...group,
    matches: group.matches.map(m =>
      m.id === matchId ? { ...m, homeScore: null, awayScore: null, played: false } : m
    ),
  }

  const baseStandings = computeStandings(baseGroup)

  function status(standings: TeamStanding[], grp: Group, name: string) {
    const idx = standings.findIndex(s => s.team.name === name)
    return {
      clinched: idx >= 0 && idx <= 2 ? getClinched(standings, idx, grp) : null,
      eliminated: idx >= 0 ? isMathEliminated(standings, idx, grp) : false,
    }
  }

  const baseHome = status(baseStandings, baseGroup, homeTeam)
  const baseAway = status(baseStandings, baseGroup, awayTeam)

  const outcomes = [
    { hs: 1, as_: 0, homeWord: 'win',  awayWord: 'lose' },
    { hs: 0, as_: 0, homeWord: 'draw', awayWord: 'draw' },
    { hs: 0, as_: 1, homeWord: 'lose', awayWord: 'win'  },
  ]

  const messages: string[] = []

  for (const o of outcomes) {
    const grp = withOutcome(o.hs, o.as_)
    const standings = computeStandings(grp)
    const newHome = status(standings, grp, homeTeam)
    const newAway = status(standings, grp, awayTeam)
    const isDraw = o.hs === o.as_

    const teams = [
      { name: homeTeam, base: baseHome, next: newHome, word: o.homeWord },
      { name: awayTeam, base: baseAway, next: newAway, word: o.awayWord },
    ]

    const liveIsDraw = liveHomeScore === liveAwayScore
    const liveHomeWin = liveHomeScore > liveAwayScore
    const isCurrent =
      (o.hs > o.as_ && liveHomeWin) ||
      (o.hs === o.as_ && liveIsDraw) ||
      (o.hs < o.as_ && liveAwayScore > liveHomeScore)

    for (const { name, base, next, word } of teams) {
      const cond = isDraw ? 'A draw' : `If ${name} ${word}`

      if (!base.eliminated && next.eliminated) {
        messages.push({ message: `${cond} eliminates ${name}`, isCurrent })
      }
      if (!base.clinched && next.clinched) {
        const pos = next.clinched === 1 ? '1st' : next.clinched === 2 ? '2nd' : '3rd'
        messages.push({ message: `${cond}, ${name} clinch ${pos} place`, isCurrent })
      }
    }
  }

  // Deduplicate by message text, preferring isCurrent=true
  const seen = new Map<string, Implication>()
  for (const imp of messages) {
    const existing = seen.get(imp.message)
    if (!existing || imp.isCurrent) seen.set(imp.message, imp)
  }
  return [...seen.values()]
}
