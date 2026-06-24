import React, { useState, useEffect } from 'react'
import { Group } from '../types'
import { MatchEvent, TeamMatchStats } from '../services/espn'
import { MATCH_SORT_KEY } from '../data/matchDates'
import { pregameOdds } from '../utils/simulation'
import { getMatchImplications, Implication } from '../utils/standings'

interface LiveMatch {
  id: string
  homeTeam: string
  homeFlag: string
  awayTeam: string
  awayFlag: string
  homeScore: number
  awayScore: number
  clock: string
  statusDetail: string
  venue: string
  group: string
  events: MatchEvent[]
  homeStats: TeamMatchStats | null
  awayStats: TeamMatchStats | null
  homeColor: string
  awayColor: string
}

interface Props {
  groups: Group[]
}

const EVENT_ICON: Record<MatchEvent['type'], string> = {
  goal:     '⚽',
  own_goal: '⚽',
  penalty:  '⚽',
  yellow:   '🟨',
  red:      '🟥',
}

const EVENT_LABEL: Record<MatchEvent['type'], string> = {
  goal:     '',
  own_goal: ' (OG)',
  penalty:  ' (P)',
  yellow:   '',
  red:      '',
}

function StatBar({ label, home, away, showPercent = false, homeColor, awayColor }: {
  label: string; home: number; away: number; showPercent?: boolean
  homeColor: string; awayColor: string
}) {
  const total = home + away || 1
  const homePct = (home / total) * 100
  const fmt = (n: number) => showPercent ? `${Math.round(n)}%` : String(Math.round(n))
  return (
    <div className="stat-row">
      <span className="stat-val home">{fmt(home)}</span>
      <div className="stat-bar-wrap">
        <span className="stat-label">{label}</span>
        <div className="stat-bar-track">
          <div className="stat-bar-home" style={{ width: `${homePct}%`, background: homeColor }} />
          <div className="stat-bar-away" style={{ width: `${100 - homePct}%`, background: awayColor }} />
        </div>
      </div>
      <span className="stat-val away">{fmt(away)}</span>
    </div>
  )
}

function PitchMap({ match }: { match: LiveMatch }) {
  const hs = match.homeStats
  const as_ = match.awayStats
  if (!hs || !as_) return null

  // Parse elapsed minutes from clock string e.g. "66'", "90'+2'", "45'+3'"
  const clockMatch = match.clock.match(/^(\d+)(?:\+(\d+))?'/)
  const elapsed = clockMatch
    ? parseInt(clockMatch[1]) + (clockMatch[2] ? parseInt(clockMatch[2]) : 0)
    : match.statusDetail.toLowerCase().includes('half') ? 45 : 0

  // Weighted tempo: possession converted to minutes + shots×3 + corners×3
  const homeTempo = (hs.possession / 100) * elapsed + hs.totalShots * 5 + hs.corners * 3
  const awayTempo = (as_.possession / 100) * elapsed + as_.totalShots * 5 + as_.corners * 3
  const total = homeTempo + awayTempo || 1
  const homeRatio = homeTempo / total  // 0–1, how much of the bar is home

  // SVG layout
  const W = 300, H = 112
  const pad = 10
  const pw = W - pad * 2
  const ph = H - pad * 2
  const cx = W / 2
  const cy = H / 2
  const boxH = ph * 0.55
  const boxW = pw * 0.11
  const splitX = pad + pw * homeRatio

  return (
    <div className="pitch-map-wrap">
      <div className="pitch-map-label">
        <span className="pitch-map-team" style={{ color: match.homeColor }}>{match.homeFlag} {match.homeTeam}</span>
        <span className="pitch-map-title">Game Tempo</span>
        <span className="pitch-map-team" style={{ color: match.awayColor }}>{match.awayTeam} {match.awayFlag}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="pitch-map-svg" preserveAspectRatio="xMidYMid meet">
        {/* ── Pitch base ── */}
        <rect x={pad} y={pad} width={pw} height={ph} fill="#1c4d1c" rx="3" />

        {/* ── Single tempo split overlay ── */}
        {/* Use style props (CSS geometry properties) so CSS transitions animate the values */}
        <rect
          style={{ x: pad, y: pad, width: pw * homeRatio, height: ph, transition: 'width 0.8s ease' } as React.CSSProperties}
          fill={match.homeColor} fillOpacity={0.35} />
        <rect
          style={{ x: splitX, y: pad, width: pw * (1 - homeRatio), height: ph, transition: 'width 0.8s ease, x 0.8s ease' } as React.CSSProperties}
          fill={match.awayColor} fillOpacity={0.35} />

        {/* ── Pitch markings (drawn on top of overlay) ── */}
        <rect x={pad} y={pad} width={pw} height={ph}
          fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
        <line x1={cx} y1={pad} x2={cx} y2={pad + ph}
          stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={ph * 0.22}
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={1.5} fill="rgba(255,255,255,0.4)" />
        <rect x={pad} y={cy - boxH / 2} width={boxW} height={boxH}
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <rect x={pad + pw - boxW} y={cy - boxH / 2} width={boxW} height={boxH}
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <rect x={pad - 3} y={cy - ph * 0.14} width={3} height={ph * 0.28}
          fill="rgba(255,255,255,0.5)" />
        <rect x={pad + pw} y={cy - ph * 0.14} width={3} height={ph * 0.28}
          fill="rgba(255,255,255,0.5)" />

        {/* ── Split marker line — use transform so x1/x2 can be transitioned ── */}
        <line
          style={{ transform: `translateX(${splitX - pad}px)`, transition: 'transform 0.8s ease' }}
          x1={pad} y1={pad + 2} x2={pad} y2={pad + ph - 2}
          stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    </div>
  )
}

function LiveCard({ match, group }: { match: LiveMatch; group: Group }) {
  const isHalfTime = match.statusDetail.toLowerCase().includes('half')
  const homeWinning = match.homeScore > match.awayScore
  const awayWinning = match.awayScore > match.homeScore

  const homeEvents = match.events.filter(e => e.side === 'home')
  const awayEvents = match.events.filter(e => e.side === 'away')
  const hasStats = match.homeStats && match.awayStats
  const implications = getMatchImplications(group, match.id, match.homeScore, match.awayScore)

  return (
    <div className="live-card" style={{
      background: `linear-gradient(to right, ${match.homeColor}22 0%, transparent 40%, transparent 60%, ${match.awayColor}40 100%), #e1d8d8`
    }}>

      {/* ── Header ── */}
      <div className="live-card-header">
        <span className="live-pill">
          <span className="live-dot" />
          LIVE
        </span>
        <span className="live-group">Group {match.group}</span>
        <span className="live-clock">
          {isHalfTime ? 'Half Time' : match.clock || match.statusDetail || 'Live'}
        </span>
      </div>

      {/* ── Scoreline ── */}
      <div className="live-matchup">
        <div className={`live-team${homeWinning ? ' winning' : ''}`}>
          <span className="live-flag">{match.homeFlag}</span>
          <span className="live-name" style={{ color: match.homeColor }}>{match.homeTeam}</span>
        </div>
        <div className="live-score-block">
          <span className={`live-score-num${homeWinning ? ' score-winning' : ''}`}>{match.homeScore}</span>
          <span className="live-score-sep">–</span>
          <span className={`live-score-num${awayWinning ? ' score-winning' : ''}`}>{match.awayScore}</span>
        </div>
        <div className={`live-team away${awayWinning ? ' winning' : ''}`}>
          <span className="live-name" style={{ color: match.awayColor }}>{match.awayTeam}</span>
          <span className="live-flag">{match.awayFlag}</span>
        </div>
      </div>

      {/* ── Implications ── */}
      {implications.length > 0 && (
        <div className="live-implications">
          {implications.map((imp, i) => (
            <div key={i} className={`live-implication${imp.isCurrent ? ' live-implication--current' : ''}`}>
              {imp.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Pitch map ── */}
      <PitchMap match={match} />

      {/* ── Event log ── */}
      {match.events.length > 0 && (
        <div className="live-events">
          <div className="live-events-col home">
            {homeEvents.map((e, i) => (
              <div key={i} className={`live-event home ${e.type}`}>
                <span className="event-icon">{EVENT_ICON[e.type]}</span>
                <span className="event-player">{e.player}{EVENT_LABEL[e.type]}</span>
                <span className="event-minute">{e.minute}</span>
              </div>
            ))}
          </div>
          <div className="live-events-divider" />
          <div className="live-events-col away">
            {awayEvents.map((e, i) => (
              <div key={i} className={`live-event away ${e.type}`}>
                <span className="event-minute">{e.minute}</span>
                <span className="event-player">{e.player}{EVENT_LABEL[e.type]}</span>
                <span className="event-icon">{EVENT_ICON[e.type]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {hasStats && (
        <div className="live-stats">
          <StatBar label="Possession"
            home={match.homeStats!.possession} away={match.awayStats!.possession}
            showPercent homeColor={match.homeColor} awayColor={match.awayColor} />
          <StatBar label="Shots on Target"
            home={match.homeStats!.shotsOnTarget} away={match.awayStats!.shotsOnTarget}
            homeColor={match.homeColor} awayColor={match.awayColor} />
          <StatBar label="Total Shots"
            home={match.homeStats!.totalShots} away={match.awayStats!.totalShots}
            homeColor={match.homeColor} awayColor={match.awayColor} />
        </div>
      )}

      {/* ── Venue ── */}
      {match.venue && <div className="live-venue">{match.venue}</div>}
    </div>
  )
}

interface PreGame {
  id: string
  homeTeam: string
  homeFlag: string
  homeColor: string
  awayTeam: string
  awayFlag: string
  awayColor: string
  kickoffMs: number
  group: string
  odds: { home: number; draw: number; away: number }
}

function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Kickoff!'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function PreGameCard({ pg }: { pg: PreGame }) {
  const now = useNow(1_000)
  const msUntil = pg.kickoffMs - now
  const { home, draw, away } = pg.odds
  const homePct = Math.round(home * 100)
  const drawPct = Math.round(draw * 100)
  const awayPct = 100 - homePct - drawPct

  return (
    <div className="live-card pregame-card" style={{
      background: `linear-gradient(to right, ${pg.homeColor}22 0%, transparent 40%, transparent 60%, ${pg.awayColor}40 100%), #e1d8d8`
    }}>
      <div className="live-card-header">
        <span className="pregame-pill">UPCOMING</span>
        <span className="live-group">Group {pg.group}</span>
        <span className="pregame-countdown">
          {msUntil > 0 ? `Kickoff in ${formatCountdown(msUntil)}` : 'Starting soon'}
        </span>
      </div>

      <div className="live-matchup">
        <div className="live-team">
          <span className="live-flag">{pg.homeFlag}</span>
          <span className="live-name" style={{ color: pg.homeColor }}>{pg.homeTeam}</span>
        </div>
        <div className="live-score-block">
          <span className="pregame-vs">vs</span>
        </div>
        <div className="live-team away">
          <span className="live-name" style={{ color: pg.awayColor }}>{pg.awayTeam}</span>
          <span className="live-flag">{pg.awayFlag}</span>
        </div>
      </div>

      <div className="pregame-odds">
        <div className="pregame-odds-label">Win probability</div>
        <div className="pregame-odds-bar">
          <div className="pregame-odds-seg" style={{ width: `${homePct}%`, background: pg.homeColor }}>
            {homePct >= 12 && <span>{homePct}%</span>}
          </div>
          <div className="pregame-odds-seg draw" style={{ width: `${drawPct}%` }}>
            {drawPct >= 10 && <span>{drawPct}%</span>}
          </div>
          <div className="pregame-odds-seg" style={{ width: `${awayPct}%`, background: pg.awayColor }}>
            {awayPct >= 12 && <span>{awayPct}%</span>}
          </div>
        </div>
        <div className="pregame-odds-legend">
          <span>{pg.homeTeam}</span>
          <span>Draw</span>
          <span>{pg.awayTeam}</span>
        </div>
      </div>
    </div>
  )
}

const ONE_HOUR = 60 * 60_000

export function LiveGames({ groups }: Props) {
  const now = useNow()

  const liveMatches: LiveMatch[] = groups.flatMap(g =>
    g.matches
      .filter(m => !m.played && m.homeScore !== null && m.awayScore !== null)
      .map(m => ({
        id: m.id,
        homeTeam: m.homeTeam,
        homeFlag: g.teams.find(t => t.name === m.homeTeam)?.flag ?? '',
        awayTeam: m.awayTeam,
        awayFlag: g.teams.find(t => t.name === m.awayTeam)?.flag ?? '',
        homeScore: m.homeScore!,
        awayScore: m.awayScore!,
        clock: m.clock ?? '',
        statusDetail: m.statusDetail ?? '',
        venue: m.venue ?? '',
        group: g.id,
        events: m.events ?? [],
        homeStats: m.homeStats ?? null,
        awayStats: m.awayStats ?? null,
        homeColor: m.homeColor ?? '#888888',
        awayColor: m.awayColor ?? '#888888',
      }))
  )

  const preGames: PreGame[] = groups.flatMap(g =>
    g.matches
      .filter(m => {
        if (m.played || m.homeScore !== null) return false
        const iso = MATCH_SORT_KEY[m.id]
        if (!iso) return false
        const kickoffMs = new Date(iso).getTime()
        return kickoffMs > now && kickoffMs - now <= ONE_HOUR
      })
      .map(m => {
        const kickoffMs = new Date(MATCH_SORT_KEY[m.id]).getTime()
        return {
          id: m.id,
          homeTeam: m.homeTeam,
          homeFlag: g.teams.find(t => t.name === m.homeTeam)?.flag ?? '',
          homeColor: m.homeColor ?? '#888888',
          awayTeam: m.awayTeam,
          awayFlag: g.teams.find(t => t.name === m.awayTeam)?.flag ?? '',
          awayColor: m.awayColor ?? '#888888',
          kickoffMs,
          group: g.id,
          odds: pregameOdds(m.homeTeam, m.awayTeam, groups),
        }
      })
  )

  if (liveMatches.length === 0 && preGames.length === 0) return null

  return (
    <section className="live-section">
      <div className="live-cards">
        {preGames.map(pg => <PreGameCard key={pg.id} pg={pg} />)}
        {liveMatches.map(m => {
          const grp = groups.find(g => g.id === m.group)!
          return <LiveCard key={m.id} match={m} group={grp} />
        })}
      </div>
    </section>
  )
}
