import React, { useEffect } from 'react'

interface Props {
  homeTeam: string
  homeFlag: string
  homeColor: string
  awayTeam: string
  awayFlag: string
  awayColor: string
  odds: { home: number; draw: number; away: number }
  context: string
  onClose: () => void
}

export function MatchOddsModal({ homeTeam, homeFlag, homeColor, awayTeam, awayFlag, awayColor, odds, context, onClose }: Props) {
  const homePct = Math.round(odds.home * 100)
  const drawPct = Math.round(odds.draw * 100)
  const awayPct = 100 - homePct - drawPct

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="odds-modal-backdrop" onClick={onClose}>
      <div className="odds-modal" onClick={e => e.stopPropagation()}>
        <div className="odds-modal-context">{context}</div>

        <div className="odds-modal-teams">
          <span className="odds-modal-team" style={{ color: homeColor }}>
            {homeFlag} {homeTeam}
          </span>
          <span className="odds-modal-vs">vs</span>
          <span className="odds-modal-team away" style={{ color: awayColor }}>
            {awayTeam} {awayFlag}
          </span>
        </div>

        <div className="odds-modal-label">Win probability</div>

        <div className="odds-modal-bar">
          <div className="odds-modal-seg" style={{ width: `${homePct}%`, background: homeColor }}>
            {homePct >= 10 && <span>{homePct}%</span>}
          </div>
          <div className="odds-modal-seg draw" style={{ width: `${drawPct}%` }}>
            {drawPct >= 8 && <span>{drawPct}%</span>}
          </div>
          <div className="odds-modal-seg" style={{ width: `${awayPct}%`, background: awayColor }}>
            {awayPct >= 10 && <span>{awayPct}%</span>}
          </div>
        </div>

        <div className="odds-modal-legend">
          <span style={{ color: homeColor }}>{homeTeam}</span>
          <span>Draw</span>
          <span style={{ color: awayColor }}>{awayTeam}</span>
        </div>

        <div className="odds-modal-note">
          Based on FIFA rankings + tournament form · click anywhere to close
        </div>
      </div>
    </div>
  )
}
