import React, { useState } from 'react'
import { Group } from '../types'
import { computeStandings } from '../utils/standings'
import { SimulationResult } from '../utils/simulation'

const YOUR_GAME_GROUPS = new Set(['A', 'B', 'C', 'D', 'F'])

interface ThirdPlaceRow {
  rank: number
  teamName: string
  flag: string
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  qualifying: boolean
  onCutline: boolean
  yourGame: boolean
  matchOdds: number | null  // P(this team is the Jun 29 match-74 opponent)
}

interface Props {
  groups: Group[]
  simResult: SimulationResult | null
}

export function ThirdPlaceTracker({ groups, simResult }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const oddsMap = new Map<string, number>()
  if (simResult) {
    for (const { teamName, probability } of simResult.thirdPlaceCandidates) {
      oddsMap.set(teamName, probability)
    }
  }

  const rows: ThirdPlaceRow[] = groups
    .map(g => {
      const standings = computeStandings(g)
      if (standings.length < 3) return null
      const s = standings[2]
      return {
        teamName: s.team.name,
        flag: s.team.flag,
        group: g.id,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference: s.goalDifference,
        points: s.points,
      }
    })
    .filter((r): r is Exclude<typeof r, null> => r !== null)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      return a.group.localeCompare(b.group)
    })
    .map((r, i) => ({
      ...r,
      rank: i + 1,
      qualifying: i < 8,
      onCutline: i === 7,
      yourGame: YOUR_GAME_GROUPS.has(r.group),
      matchOdds: YOUR_GAME_GROUPS.has(r.group) ? (oddsMap.get(r.teamName) ?? null) : null,
    }))

  const showOddsCol = rows.some(r => r.yourGame)

  return (
    <section className="third-place-tracker">
      <div
        className="third-place-tracker-header"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="collapse-chevron">{collapsed ? '▶' : '▼'}</span>
        <span className="third-place-tracker-title">Top 8 Third Place</span>
        <span className="third-place-tracker-sub">
          Best 8 of 12 third-place teams advance to the knockout round
        </span>
      </div>

      {!collapsed && (
        <div className="third-place-table-wrap">
          <table className="third-place-table">
            <thead>
              <tr>
                <th className="tp-rank">#</th>
                <th className="tp-team">Team</th>
                <th className="tp-grp" title="Group">Grp</th>
                <th title="Played">P</th>
                <th title="Won">W</th>
                <th title="Drawn">D</th>
                <th title="Lost">L</th>
                <th title="Goals For">GF</th>
                <th title="Goals Against">GA</th>
                <th title="Goal Difference">GD</th>
                <th title="Points">Pts</th>
                {showOddsCol && <th className="tp-odds" title="Chance this is your Jun 29 opponent">Jun 29</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <React.Fragment key={r.group}>
                  <tr className={`tp-row ${r.qualifying ? 'tp-qualifying' : 'tp-out'}${r.yourGame ? ' tp-your-game' : ''}`}>
                    <td className="tp-rank">{r.rank}</td>
                    <td className="tp-team">
                      <span className="flag">{r.flag}</span>
                      <span>{r.teamName}</span>
                      {r.yourGame && <span className="tp-your-game-badge" title="Potential Jun 29 opponent">📍</span>}
                    </td>
                    <td className="tp-grp">{r.group}</td>
                    <td>{r.played}</td>
                    <td>{r.won}</td>
                    <td>{r.drawn}</td>
                    <td>{r.lost}</td>
                    <td>{r.goalsFor}</td>
                    <td>{r.goalsAgainst}</td>
                    <td>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
                    <td className="tp-pts">{r.points}</td>
                    {showOddsCol && (
                      <td className="tp-odds">
                        {r.matchOdds !== null ? `${Math.round(r.matchOdds * 100)}%` : '—'}
                      </td>
                    )}
                  </tr>
                  {r.onCutline && (
                    <tr className="tp-cutline">
                      <td colSpan={showOddsCol ? 12 : 11} />
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
