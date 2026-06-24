import { useState, useEffect, useRef, useCallback } from 'react'
import { Group } from '../types'
import { runSimulation, SimulationResult } from '../utils/simulation'

function countPlayedMatches(groups: Group[]): number {
  return groups.reduce((sum, g) => sum + g.matches.filter(m => m.played).length, 0)
}

export function useSimulation(groups: Group[]): { result: SimulationResult | null; rerun: () => void } {
  const [result, setResult] = useState<SimulationResult | null>(null)
  const groupsRef = useRef<Group[]>(groups)
  const playedRef = useRef<number>(-1) // -1 forces run on first mount

  useEffect(() => {
    groupsRef.current = groups
  }, [groups])

  const rerun = useCallback(() => {
    const sim = runSimulation(groupsRef.current)
    setResult(sim)
  }, [])

  // Run once on mount
  useEffect(() => {
    rerun()
  }, [rerun])

  // Re-run only when a match transitions to played
  useEffect(() => {
    const played = countPlayedMatches(groups)
    if (playedRef.current === -1) {
      // First mount already handled above
      playedRef.current = played
      return
    }
    if (played > playedRef.current) {
      playedRef.current = played
      rerun()
    }
  }, [groups, rerun])

  return { result, rerun }
}
