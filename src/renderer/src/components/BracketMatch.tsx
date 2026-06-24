import React, { useState } from 'react'
import { Group } from '../types'
import { KnockoutMatch, KnockoutTeam } from '../types'
import { pregameOdds } from '../utils/simulation'
import { MatchOddsModal } from './MatchOddsModal'

interface Props {
  match: KnockoutMatch
  groups: Group[]
  slotLabels?: { home: string; away: string }
}

function teamColor(name: string, groups: Group[]): string {
  for (const g of groups) {
    for (const m of g.matches) {
      if (m.homeTeam === name && m.homeColor) return m.homeColor
      if (m.awayTeam === name && m.awayColor) return m.awayColor
    }
  }
  return '#888888'
}

function TeamRow({
  team,
  score,
  isWinner,
  isLoser,
  slotLabel,
}: {
  team: KnockoutTeam | null
  score: number | null
  isWinner: boolean
  isLoser: boolean
  slotLabel?: string
}) {
  const cls = !team
    ? 'bm-team tbd'
    : isWinner
    ? 'bm-team winner'
    : isLoser
    ? 'bm-team loser'
    : team.locked
    ? 'bm-team locked'
    : 'bm-team uncertain'
  return (
    <div className={cls}>
      <span className="bm-flag">{team ? team.flag : '•'}</span>
      <span className="bm-name">{team ? team.name : (slotLabel ?? 'TBD')}</span>
      {score !== null && <span className="bm-score">{score}</span>}
    </div>
  )
}

export function BracketMatch({ match, groups, slotLabels }: Props) {
  const [showOdds, setShowOdds] = useState(false)

  const hasScore = match.homeScore !== null && match.awayScore !== null
  const homeWins = hasScore && match.homeScore! > match.awayScore!
  const awayWins = hasScore && match.awayScore! > match.homeScore!
  const bothKnown = match.homeTeam !== null && match.awayTeam !== null

  const boxClass = `bm${match.isUserMatch ? ' user-match' : ''}${match.played ? ' played' : ''}`

  return (
    <>
      <div className={boxClass} onClick={() => bothKnown && setShowOdds(true)}>
        <TeamRow
          team={match.homeTeam}
          score={match.homeScore}
          isWinner={homeWins}
          isLoser={awayWins}
          slotLabel={slotLabels?.home}
        />
        <div className="bm-divider" />
        <TeamRow
          team={match.awayTeam}
          score={match.awayScore}
          isWinner={awayWins}
          isLoser={homeWins}
          slotLabel={slotLabels?.away}
        />
        <div className={`bm-date${match.isUserMatch ? ' bm-date--user' : ''}`}>
          {match.isUserMatch && <span className="bm-date-pin">📍</span>}
          {match.date}
        </div>
      </div>

      {showOdds && bothKnown && (() => {
        const home = match.homeTeam!
        const away = match.awayTeam!
        const roundLabel = match.date ? match.date : 'Knockout Stage'
        return (
          <MatchOddsModal
            homeTeam={home.name}
            homeFlag={home.flag}
            homeColor={teamColor(home.name, groups)}
            awayTeam={away.name}
            awayFlag={away.flag}
            awayColor={teamColor(away.name, groups)}
            odds={pregameOdds(home.name, away.name, groups)}
            context={roundLabel}
            onClose={() => setShowOdds(false)}
          />
        )
      })()}
    </>
  )
}
