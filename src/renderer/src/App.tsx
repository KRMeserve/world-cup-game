import React, { useState, useEffect, useRef, useMemo } from 'react'
import { GroupCard } from './components/GroupCard'
import { GamePreview } from './components/GamePreview'
import { BracketView } from './components/BracketView'
import { Fireworks } from './components/Fireworks'
import { LiveGames } from './components/LiveGames'
import { ThirdPlaceTracker } from './components/ThirdPlaceTracker'
import { useStore } from './store/useStore'
import { useSimulation } from './hooks/useSimulation'
import { playFireworkSounds } from './utils/fireworkSound'
import { resolveBracket } from './utils/bracket'

const THIRD_PLACE_SOURCE_GROUPS = new Set(['A', 'B', 'C', 'D', 'F'])
const OUR_GAME_GROUP = 'E'

function SyncIndicator({
  status,
  lastSynced,
  error,
  onSync,
  onFireworks,
  onThemeToggle,
  theme,
}: {
  status: string
  lastSynced: Date | null
  error: string | null
  onSync: () => void
  onFireworks: () => void
  onThemeToggle: () => void
  theme: 'dark' | 'light'
}) {
  const timeStr = lastSynced
    ? lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className="sync-indicator">
      <button
        className={`sync-btn ${status}`}
        onClick={onSync}
        disabled={status === 'syncing'}
        title={error ?? 'Refresh scores from ESPN'}
      >
        <span className={`sync-icon ${status === 'syncing' ? 'spinning' : ''}`}>⟳</span>
        <span className="sync-label">
          {status === 'syncing' && 'Syncing…'}
          {status === 'success' && timeStr && `Updated ${timeStr}`}
          {status === 'error' && 'Sync failed'}
          {status === 'idle' && 'ESPN Live'}
        </span>
      </button>
      <button
        className="fireworks-btn"
        onClick={onFireworks}
        title="Celebrate!"
      >
        🎆
      </button>
      <button
        className="theme-btn"
        onClick={onThemeToggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  )
}

export default function App() {
  const { groups, resetGroup, sync, syncStatus, lastSynced, syncError, knockoutScores, goalFlash } = useStore()
  const { result: simResult, rerun: rerunSim } = useSimulation(groups)
  const knockoutMatches = useMemo(
    () => resolveBracket(groups, knockoutScores),
    [groups, knockoutScores]
  )

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('wc2026-theme') as 'dark' | 'light') ?? 'dark'
  )
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('wc2026-theme', theme)
  }, [theme])
  function toggleTheme() { setTheme(t => t === 'dark' ? 'light' : 'dark') }

  // Fireworks: triggered by goal detection or manually
  const [showFireworks, setShowFireworks] = useState(false)
  const [fireworksKey, setFireworksKey] = useState(0)
  const prevGoalFlash = useRef(0)

  function triggerFireworks() {
    setFireworksKey(k => k + 1) // remount → fresh random burst pattern
    setShowFireworks(true)
    playFireworkSounds()
  }

  useEffect(() => {
    if (goalFlash > prevGoalFlash.current) {
      prevGoalFlash.current = goalFlash
      triggerFireworks()
    }
  }, [goalFlash])

  const ourMatch = knockoutMatches.find(m => m.id === 74)
  const ourHome = ourMatch?.homeTeam ?? null
  const ourAway = ourMatch?.awayTeam ?? null

  return (
    <div className="app">
      {showFireworks && (
        <Fireworks key={fireworksKey} onDone={() => setShowFireworks(false)} />
      )}
      <header className="app-header">
        <div className="header-left">
          <h1>FIFA World Cup</h1>
          <span className="year-badge">2026</span>
        </div>
        <div className="your-game-banner">
          <div className="your-game-label">Your Game · Jun 29 @ 4:30 PM</div>
          <div className="your-game-matchup">
            <span className="matchup-team">
              {ourHome?.locked ? `${ourHome.flag} ${ourHome.name}` : 'Group E Winner'}
            </span>
            <span className="matchup-vs">vs</span>
            <span className="matchup-team">
              {ourAway?.locked ? `${ourAway.flag} ${ourAway.name}` : '3rd Place (A / B / C / D / F)'}
            </span>
          </div>
        </div>
        <SyncIndicator
          status={syncStatus}
          lastSynced={lastSynced}
          error={syncError}
          onSync={sync}
          onFireworks={triggerFireworks}
          onThemeToggle={toggleTheme}
          theme={theme}
        />
      </header>

      <GamePreview result={simResult} onRerun={rerunSim} />

      <LiveGames groups={groups} />

      <main className="groups-grid">
        {groups.map(group => {
          const highlight =
            group.id === OUR_GAME_GROUP
              ? 'our-game'
              : THIRD_PLACE_SOURCE_GROUPS.has(group.id)
              ? 'third-place-source'
              : null

          return (
            <GroupCard
              key={group.id}
              group={group}
              allGroups={groups}
              highlight={highlight}
              onReset={() => resetGroup(group.id)}
            />
          )
        })}
      </main>

      <ThirdPlaceTracker groups={groups} simResult={simResult} />

      <section className="bracket-section">
        <div className="bracket-header">
          <h2>Knockout Stage</h2>
        </div>
        <BracketView matches={knockoutMatches} groups={groups} />
      </section>

      <footer className="app-footer">
        <span>🟢 Advancing &nbsp;·&nbsp; 🟡 3rd Place &nbsp;·&nbsp; ⬜ Eliminated &nbsp;·&nbsp; ✓ Clinched position &nbsp;·&nbsp; Click any match to see win probability &nbsp;·&nbsp; Scores auto-sync from ESPN</span>
      </footer>
    </div>
  )
}
