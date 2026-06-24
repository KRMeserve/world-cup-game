import { useState, useEffect, useCallback, useRef } from 'react'
import { Group } from '../types'
import { INITIAL_GROUPS } from '../data/groups'
import { fetchStandings, fetchScoreboard, ESPNMatch } from '../services/espn'

const STORAGE_KEY = 'wc2026-results'
const KNOCKOUT_STORAGE_KEY = 'wc2026-knockout'

type KnockoutScoreEntry = { homeScore: number; awayScore: number; played: boolean }

function loadKnockoutScores(): Record<number, KnockoutScoreEntry> {
  try {
    const saved = localStorage.getItem(KNOCKOUT_STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return {}
}

// Poll every 60s normally; every 30s when a game is live
const POLL_INTERVAL_IDLE = 60_000
const POLL_INTERVAL_LIVE = 30_000

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

function loadGroups(): Group[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return INITIAL_GROUPS
}

function applyESPNData(
  groups: Group[],
  espnMatches: ESPNMatch[]
): { groups: Group[]; newGoals: number } {
  // Build lookup: "HomeTeam|AwayTeam" → ESPNMatch
  const byTeams = new Map<string, ESPNMatch>()
  for (const m of espnMatches) {
    byTeams.set(`${m.homeTeam}|${m.awayTeam}`, m)
    byTeams.set(`${m.awayTeam}|${m.homeTeam}`, m)
  }

  let newGoals = 0

  const updatedGroups = groups.map(g => ({
    ...g,
    matches: g.matches.map(m => {
      const espn =
        byTeams.get(`${m.homeTeam}|${m.awayTeam}`) ??
        byTeams.get(`${m.awayTeam}|${m.homeTeam}`)
      if (!espn) return m
      // For pre-game matches apply team colors (available in ESPN response) but nothing else
      if (espn.status === 'pre') {
        return {
          ...m,
          homeColor: espn.homeColor || m.homeColor,
          awayColor: espn.awayColor || m.awayColor,
        }
      }

      // Preserve correct home/away orientation from our data
      const homeIsHome = espn.homeTeam === m.homeTeam
      const newHome = homeIsHome ? espn.homeScore : espn.awayScore
      const newAway = homeIsHome ? espn.awayScore : espn.homeScore

      // Detect goals: only for live matches where we already had a prior score
      // (avoids firing on first sync when scores come in as non-null for the first time)
      if (espn.status === 'in') {
        if (m.homeScore !== null && newHome !== null && newHome > m.homeScore) {
          newGoals += newHome - m.homeScore
        }
        if (m.awayScore !== null && newAway !== null && newAway > m.awayScore) {
          newGoals += newAway - m.awayScore
        }
      }

      // When ESPN has teams in opposite order, flip everything that is side-dependent
      const espnHomeStats = homeIsHome ? espn.homeStats : espn.awayStats
      const espnAwayStats = homeIsHome ? espn.awayStats : espn.homeStats
      const espnHomeColor = homeIsHome ? espn.homeColor : espn.awayColor
      const espnAwayColor = homeIsHome ? espn.awayColor : espn.homeColor
      const espnEvents = espn.status !== 'pre'
        ? (homeIsHome
            ? espn.events
            : espn.events.map(e => ({ ...e, side: e.side === 'home' ? 'away' as const : 'home' as const })))
        : m.events

      return {
        ...m,
        homeScore: newHome,
        awayScore: newAway,
        played: espn.played,
        clock: espn.status === 'in' ? espn.displayClock : undefined,
        statusDetail: espn.status === 'in' ? espn.statusDetail : undefined,
        venue: espn.venue || m.venue,
        events: espnEvents,
        homeStats: espn.status !== 'pre' ? espnHomeStats : m.homeStats,
        awayStats: espn.status !== 'pre' ? espnAwayStats : m.awayStats,
        homeColor: espnHomeColor || m.homeColor,
        awayColor: espnAwayColor || m.awayColor,
      }
    }),
  }))

  return { groups: updatedGroups, newGoals }
}

export function useStore() {
  const [groups, setGroups] = useState<Group[]>(loadGroups)
  const [knockoutScores, setKnockoutScores] = useState<Record<number, KnockoutScoreEntry>>(loadKnockoutScores)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [goalFlash, setGoalFlash] = useState(0) // increments whenever a goal is detected
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Mirror of `groups` kept in a ref so the async `sync` callback can always
  // read the *latest* state without needing it in its dependency array.
  const groupsRef = useRef<Group[]>(groups)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
    groupsRef.current = groups // keep ref in sync on every state change
  }, [groups])

  useEffect(() => {
    localStorage.setItem(KNOCKOUT_STORAGE_KEY, JSON.stringify(knockoutScores))
  }, [knockoutScores])

  const sync = useCallback(async () => {
    setSyncStatus('syncing')
    setSyncError(null)
    try {
      const [espnMatches] = await Promise.all([
        fetchScoreboard(),
        fetchStandings(), // fetched for future use (bracket view etc.)
      ])

      const anyLive = espnMatches.some(m => m.status === 'in')

      // Compute goals synchronously against the ref (always current), then
      // push the new groups into React state. We cannot rely on the functional
      // updater running synchronously — in React 18 it is queued, so reading a
      // side-effect variable set inside it would always see the initial value.
      const { groups: nextGroups, newGoals } = applyESPNData(groupsRef.current, espnMatches)
      setGroups(nextGroups)
      if (newGoals > 0) setGoalFlash(c => c + newGoals)

      setSyncStatus('success')
      setLastSynced(new Date())

      // Schedule next poll
      if (pollRef.current) clearTimeout(pollRef.current)
      pollRef.current = setTimeout(sync, anyLive ? POLL_INTERVAL_LIVE : POLL_INTERVAL_IDLE)
    } catch (err) {
      setSyncStatus('error')
      setSyncError(err instanceof Error ? err.message : 'Unknown error')
      // Retry after 2 min on error
      if (pollRef.current) clearTimeout(pollRef.current)
      pollRef.current = setTimeout(sync, 120_000)
    }
  }, [])

  // Kick off on mount
  useEffect(() => {
    sync()
    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
  }, [sync])

  function updateMatch(groupId: string, matchId: string, homeScore: number | null, awayScore: number | null) {
    setGroups(prev =>
      prev.map(g => {
        if (g.id !== groupId) return g
        return {
          ...g,
          matches: g.matches.map(m => {
            if (m.id !== matchId) return m
            const played = homeScore !== null && awayScore !== null
            return { ...m, homeScore, awayScore, played }
          }),
        }
      })
    )
  }

  function resetGroup(groupId: string) {
    const initial = INITIAL_GROUPS.find(g => g.id === groupId)
    if (!initial) return
    setGroups(prev => prev.map(g => g.id === groupId ? { ...initial } : g))
  }

  function updateKnockoutMatch(matchId: number, homeScore: number | null, awayScore: number | null) {
    setKnockoutScores(prev => {
      if (homeScore === null || awayScore === null) {
        const next = { ...prev }
        delete next[matchId]
        return next
      }
      return { ...prev, [matchId]: { homeScore, awayScore, played: true } }
    })
  }

  return { groups, updateMatch, resetGroup, sync, syncStatus, lastSynced, syncError, knockoutScores, goalFlash }
}
