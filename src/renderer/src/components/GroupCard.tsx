import React, { useState, useEffect } from 'react'
import { Group, Match } from '../types'
import { computeStandings, getLiveTeams, gamesRemaining, getClinched, isMathEliminated } from '../utils/standings'
import { MATCH_DATES, MATCH_SORT_KEY } from '../data/matchDates'
import { FIFA_RANKINGS, pregameOdds } from '../utils/simulation'
import { MatchOddsModal } from './MatchOddsModal'



function useCountdown(targetISO: string | undefined): number {
  const [ms, setMs] = useState(() =>
    targetISO ? Math.max(0, new Date(targetISO).getTime() - Date.now()) : 0
  )
  useEffect(() => {
    if (!targetISO) return
    const tick = () => setMs(Math.max(0, new Date(targetISO).getTime() - Date.now()))
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetISO])
  return ms
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Kick off!'
  const s = Math.floor(ms / 1000)
  const days  = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins  = Math.floor((s % 3600) / 60)
  const secs  = s % 60
  if (days > 0)  return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`
  return `${mins}m ${secs}s`
}

interface MatchOddsState {
  match: Match
  odds: { home: number; draw: number; away: number }
}

interface Props {
  group: Group
  allGroups: Group[]
  highlight: 'our-game' | 'third-place-source' | null
  onReset: () => void
}

export function GroupCard({ group, allGroups, highlight, onReset }: Props) {
  const standings = computeStandings(group)
  const liveTeams = getLiveTeams(group)
  const [oddsState, setOddsState] = useState<MatchOddsState | null>(null)

  function openOdds(match: Match) {
    setOddsState({
      match,
      odds: pregameOdds(match.homeTeam, match.awayTeam, allGroups),
    })
  }

  const headerClass =
    highlight === 'our-game'
      ? 'group-header our-game'
      : highlight === 'third-place-source'
      ? 'group-header third-place-source'
      : 'group-header'

  const cardHighlightClass =
    highlight === 'our-game'
      ? 'highlighted our-game-card'
      : highlight === 'third-place-source'
      ? 'highlighted third-source-card'
      : ''

  const gamesPlayed = group.matches.filter(m => m.played).length

  // Next upcoming match(es): unplayed, not in-progress, closest future kickoff
  const now = Date.now()
  const FOUR_HOURS = 4 * 60 * 60_000
  const upcomingMatches = [...group.matches]
    .filter(m => !m.played && m.homeScore === null && MATCH_SORT_KEY[m.id])
    .sort((a, b) => MATCH_SORT_KEY[a.id].localeCompare(MATCH_SORT_KEY[b.id]))
  // Find the earliest kickoff that hasn't passed (with 90min grace)
  const nextKickoffISO = upcomingMatches.find(
    m => new Date(MATCH_SORT_KEY[m.id]).getTime() > now - 90 * 60_000
  )?.id
  const nextKickoffTime = nextKickoffISO ? new Date(MATCH_SORT_KEY[nextKickoffISO]).getTime() : null
  // All matches sharing that same kickoff time
  const nextUpIds = nextKickoffTime
    ? new Set(upcomingMatches
        .filter(m => new Date(MATCH_SORT_KEY[m.id]).getTime() === nextKickoffTime)
        .map(m => m.id))
    : new Set<string>()
  // Only show countdown within 4 hours of kickoff
  const withinWindow = nextKickoffTime !== null && (nextKickoffTime - now) < FOUR_HOURS
  const countdownTarget = withinWindow && nextKickoffISO ? MATCH_SORT_KEY[nextKickoffISO] : undefined
  const countdown = useCountdown(countdownTarget)

  return (
    <div className={`group-card ${cardHighlightClass}`}>
      <div className={headerClass}>
        <span className="group-label">Group {group.id}</span>
        {highlight === 'our-game' && <span className="badge">Your Game — 1st Place</span>}
        {highlight === 'third-place-source' && <span className="badge">3rd Place Matters</span>}
        <button className="reset-btn" onClick={onReset} title="Reset group">↺</button>
      </div>

      {/* Standings table */}
      <table className="standings-table">
        <thead>
          <tr>
            <th className="pos">#</th>
            <th className="team-col">Team</th>
            <th title="Played">P</th>
            <th title="Won">W</th>
            <th title="Drawn">D</th>
            <th title="Lost">L</th>
            <th title="Goals For">GF</th>
            <th title="Goals Against">GA</th>
            <th title="Goal Difference">GD</th>
            <th title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const isAdvancing = i < 2
            const isThird = i === 2
            const isLive = liveTeams.has(row.team.name)
            const mathElim = isMathEliminated(standings, i, group)
            const clinched = getClinched(standings, i, group)
            const rowClass = `${isAdvancing ? 'row-advancing' : isThird ? 'row-third' : 'row-eliminated'}${mathElim ? ' row-math-eliminated' : ''}${clinched ? ' row-clinched' : ''}`
            return (
              <tr key={row.team.name} className={`${rowClass}${isLive ? ' row-live' : ''}`}>
                <td className="pos">{i + 1}</td>
                <td className="team-col">
                  {clinched && <span className="clinched-badge" title={`Clinched ${clinched === 1 ? '1st' : clinched === 2 ? '2nd' : '3rd'} place`}>✓</span>}
                  <span className="flag">{row.team.flag}</span>
                  <span className="team-name">{row.team.name}</span>
                  {FIFA_RANKINGS[row.team.name] != null && (
                    <span className="fifa-rank">FIFA Ranked #{FIFA_RANKINGS[row.team.name]}</span>
                  )}
                  {i === 0 && gamesPlayed > 0 && highlight === 'our-game' && (
                    <span className="your-game-pill">Jun 29</span>
                  )}
                </td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                <td className={`pts${isLive ? ' pts-live' : ''}`}>{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Matches */}
      <div className="matches-section">
        <div className="matches-title">Matches</div>
        {[...group.matches].sort((a, b) => (MATCH_SORT_KEY[a.id] ?? '').localeCompare(MATCH_SORT_KEY[b.id] ?? '')).map(match => {
          const isNextUp = !match.played && withinWindow && nextUpIds.has(match.id)
          const margin = match.played ? Math.abs(match.homeScore! - match.awayScore!) : 0
          const blowout = margin > 2
          const homeScoreCls = match.homeScore! > match.awayScore! ? (blowout ? 'score-blowout' : 'score-win') : match.homeScore! < match.awayScore! ? 'score-loss' : ''
          const awayScoreCls = match.awayScore! > match.homeScore! ? (blowout ? 'score-blowout' : 'score-win') : match.awayScore! < match.homeScore! ? 'score-loss' : ''
          const homeRank = FIFA_RANKINGS[match.homeTeam] ?? 60
          const awayRank = FIFA_RANKINGS[match.awayTeam] ?? 60
          const UPSET_RANK_GAP = 20
          const rankGap = Math.abs(homeRank - awayRank)
          const isUpset = match.played && (
            // Lower-ranked team wins outright (gap >= 20)
            (rankGap >= UPSET_RANK_GAP && match.homeScore !== match.awayScore && (
              (match.homeScore! > match.awayScore! && homeRank > awayRank) ||
              (match.awayScore! > match.homeScore! && awayRank > homeRank)
            )) ||
            // Draw when teams are dramatically mismatched (gap >= 40)
            (rankGap >= 40 && match.homeScore === match.awayScore)
          )
          return (
          <div
            key={match.id}
            className={`match-row ${match.played ? 'played' : ''} ${!match.played && match.homeScore !== null ? 'live' : ''} ${isNextUp ? 'next-up' : ''} ${isUpset ? 'upset' : ''}`}
            onClick={() => openOdds(match)}
          >
            <span className={`match-team home${match.played ? (match.homeScore! > match.awayScore! ? ' team-win' : match.homeScore! < match.awayScore! ? ' team-loss' : ' team-draw') : ''}`}>
              {group.teams.find(t => t.name === match.homeTeam)?.flag} {match.homeTeam}
            </span>
            {match.played ? (
              <span className="score">
                <span className={homeScoreCls}>{match.homeScore}</span>
                {' – '}
                <span className={awayScoreCls}>{match.awayScore}</span>
              </span>
            ) : (
              <span className="score">{match.clock ?? 'vs'}</span>
            )}
            <span className={`match-team away${match.played ? (match.awayScore! > match.homeScore! ? ' team-win' : match.awayScore! < match.homeScore! ? ' team-loss' : ' team-draw') : ''}`}>
              {match.awayTeam} {group.teams.find(t => t.name === match.awayTeam)?.flag}
            </span>
            {!match.played && MATCH_DATES[match.id] && (
              <span className="match-date">{MATCH_DATES[match.id]}</span>
            )}
            {isNextUp && (
              <span className="match-countdown">{formatCountdown(countdown)}</span>
            )}
          </div>
          )
        })}
      </div>
      {oddsState && (() => {
        const m = oddsState.match
        const homeColor = m.homeColor ?? group.matches.find(x => x.homeTeam === m.homeTeam && x.homeColor)?.homeColor ?? '#888888'
        const awayColor = m.awayColor ?? group.matches.find(x => x.awayTeam === m.awayTeam && x.awayColor)?.awayColor ?? '#888888'
        const homeFlag = group.teams.find(t => t.name === m.homeTeam)?.flag ?? ''
        const awayFlag = group.teams.find(t => t.name === m.awayTeam)?.flag ?? ''
        return (
          <MatchOddsModal
            homeTeam={m.homeTeam}
            homeFlag={homeFlag}
            homeColor={homeColor}
            awayTeam={m.awayTeam}
            awayFlag={awayFlag}
            awayColor={awayColor}
            odds={oddsState.odds}
            context={`Group ${group.id}`}
            onClose={() => setOddsState(null)}
          />
        )
      })()}
    </div>
  )
}
