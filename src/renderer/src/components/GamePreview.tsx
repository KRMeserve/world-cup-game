import React, { useState } from 'react'
import { SimulationResult, TeamOdds } from '../utils/simulation'

interface Props {
  result: SimulationResult | null
  onRerun: () => void
}

function ProbBar({ odds, accent }: { odds: TeamOdds; accent: 'blue' | 'green' }) {
  const pct = (odds.probability * 100).toFixed(1)
  const barWidth = `${Math.max(odds.probability * 100, 1)}%`

  return (
    <div className="prob-row">
      <span className="prob-flag">{odds.flag}</span>
      <span className="prob-name">
        {odds.teamName}
        {odds.groupId && odds.groupId !== 'E' && (
          <span className="prob-group-tag">G{odds.groupId}</span>
        )}
      </span>
      <div className="prob-bar-track">
        <div
          className={`prob-bar-fill ${accent}`}
          style={{ width: barWidth }}
        />
      </div>
      <span className="prob-pct">{pct}%</span>
    </div>
  )
}

export function GamePreview({ result, onRerun }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const isAllEqual = (odds: TeamOdds[]) =>
    odds.every(o => Math.abs(o.probability - odds[0]?.probability) < 0.001)

  const noGamesPlayed =
    result !== null &&
    isAllEqual(result.groupEFirst) &&
    isAllEqual(result.thirdPlaceCandidates)

  return (
    <div className="game-preview-panel">
      <div className="game-preview-header" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer' }}>
        <span className="game-preview-title">
          <span className="collapse-chevron">{collapsed ? '▶' : '▼'}</span>
          Jun 29 · Who You Might Watch
        </span>
        {noGamesPlayed && !collapsed && (
          <span className="game-preview-note">Equal odds — no group stage games played yet</span>
        )}
        {!noGamesPlayed && result && !collapsed && (
          <span className="game-preview-note">
            Based on {result.iterations.toLocaleString()} simulations weighted by FIFA rankings
          </span>
        )}
        <button
          className="sim-rerun-btn"
          onClick={e => { e.stopPropagation(); onRerun() }}
          title="Recalculate simulations"
        >
          ↻ Recalculate
        </button>
      </div>

      {!collapsed && <div className="game-preview-columns">
        {/* ── Group E: 1st place ───────────────────────────── */}
        <div className="game-preview-col">
          <div className="col-label blue">
            <span className="col-dot blue" />
            Group E — 1st Place
          </div>
          {result
            ? result.groupEFirst.map(odds => (
                <ProbBar key={odds.teamName} odds={odds} accent="blue" />
              ))
            : <div className="prob-loading">Calculating…</div>
          }
        </div>

        <div className="game-preview-divider">vs</div>

        {/* ── 3rd place opponents ───────────────────────────── */}
        <div className="game-preview-col">
          <div className="col-label green">
            <span className="col-dot green" />
            Qualifying 3rd Place — Groups A/B/C/D/F
          </div>
          {result
            ? result.thirdPlaceCandidates
                .filter(o => o.probability > 0.001)
                .slice(0, 10)
                .map(odds => (
                  <ProbBar key={odds.teamName} odds={odds} accent="green" />
                ))
            : <div className="prob-loading">Calculating…</div>
          }
          <div className="col-footnote">
            % = chance of finishing 3rd in group AND ranking in global top-8 third-place teams
          </div>
        </div>
      </div>}
    </div>
  )
}
