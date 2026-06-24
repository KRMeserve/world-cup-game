import React from 'react'
import { Group, KnockoutMatch } from '../types'
import { BracketMatch } from './BracketMatch'

// ── Layout constants ──────────────────────────────────────────────────────────
const SLOT_H  = 88   // px allocated per R32 match (doubles each round)
const MATCH_H = 72   // px, height of each match box wrapper (2 team rows + date row)
const MATCH_W = 158  // px, width of each match box
const CONN_W  = 40   // px, width of connector gap between rounds
const TOTAL_H = 16 * SLOT_H // 1280px total bracket height

// ── Bracket tree order (top → bottom within each round) ──────────────────────
// Pairs in each round must match: R32[0,1]→R16[0], R32[2,3]→R16[1], etc.
const ROUND_IDS = [
  [74, 77,  73, 75,  81, 82,  83, 84,  76, 78,  79, 80,  85, 87,  86, 88], // R32
  [89, 90,  94, 93,  91, 92,  96, 95],                                       // R16
  [97, 98,  99, 100],                                                         // QF
  [101, 102],                                                                 // SF
]

const ROUND_LABELS = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals']

// ── Slot labels for TBD teams ─────────────────────────────────────────────────
const SLOT_LABELS: Record<number, { home: string; away: string }> = {
  73:  { home: '2A',   away: '2B'              },
  74:  { home: '1E',   away: '3rd A/B/C/D/F'   },
  75:  { home: '1F',   away: '2C'              },
  76:  { home: '1C',   away: '2F'              },
  77:  { home: '1I',   away: '3rd C/D/F/G/H'   },
  78:  { home: '2E',   away: '2I'              },
  79:  { home: '1A',   away: '3rd C/E/F/H/I'   },
  80:  { home: '1L',   away: '3rd E/H/I/J/K'   },
  81:  { home: '1D',   away: '3rd B/E/F/I/J'   },
  82:  { home: '1G',   away: '3rd A/E/H/I/J'   },
  83:  { home: '2K',   away: '2L'              },
  84:  { home: '1H',   away: '2J'              },
  85:  { home: '1B',   away: '3rd E/F/G/I/J'   },
  86:  { home: '1J',   away: '2H'              },
  87:  { home: '1K',   away: '3rd D/E/I/J/L'   },
  88:  { home: '2D',   away: '2G'              },
  89:  { home: 'W74',  away: 'W77'             },
  90:  { home: 'W73',  away: 'W75'             },
  91:  { home: 'W76',  away: 'W78'             },
  92:  { home: 'W79',  away: 'W80'             },
  93:  { home: 'W83',  away: 'W84'             },
  94:  { home: 'W81',  away: 'W82'             },
  95:  { home: 'W86',  away: 'W88'             },
  96:  { home: 'W85',  away: 'W87'             },
  97:  { home: 'W89',  away: 'W90'             },
  98:  { home: 'W93',  away: 'W94'             },
  99:  { home: 'W91',  away: 'W92'             },
  100: { home: 'W95',  away: 'W96'             },
  101: { home: 'W97',  away: 'W98'             },
  102: { home: 'W99',  away: 'W100'            },
  103: { home: 'L101', away: 'L102'            },
  104: { home: 'W101', away: 'W102'            },
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
// Y of the top edge of a match box in slot `i` at the given slotH
function matchTop(i: number, slotH: number) {
  return i * slotH + (slotH - MATCH_H) / 2
}

// Y of the vertical center of a match box in slot `i`
function matchMid(i: number, slotH: number) {
  return i * slotH + slotH / 2
}

// ── SVG connector between two rounds ─────────────────────────────────────────
// Draws bracket arms for every pair in the source round.
// Each pair (slot 2j, slot 2j+1) funnels into the midpoint → next round's match j.
function Connectors({ slotH, count }: { slotH: number; count: number }) {
  const pairs = count / 2
  const cx = CONN_W / 2 // x of the vertical spine inside connector gap
  return (
    <svg
      width={CONN_W}
      height={TOTAL_H}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {Array.from({ length: pairs }, (_, j) => {
        const topY = matchMid(j * 2,     slotH)
        const botY = matchMid(j * 2 + 1, slotH)
        const midY = (topY + botY) / 2 // aligns exactly with next round's matchMid(j, slotH*2)
        return (
          <g key={j} stroke="var(--border)" strokeWidth="1.5" fill="none" strokeLinecap="round">
            {/* horizontal stub right from top match, down to midpoint */}
            <path d={`M0,${topY} H${cx} V${midY}`} />
            {/* horizontal stub right from bottom match, up to midpoint */}
            <path d={`M0,${botY} H${cx} V${midY}`} />
            {/* output line from spine to next column */}
            <path d={`M${cx},${midY} H${CONN_W}`} />
          </g>
        )
      })}
    </svg>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  matches: KnockoutMatch[]
  groups: Group[]
}

// ── BracketView ───────────────────────────────────────────────────────────────
export function BracketView({ matches, groups }: Props) {
  const byId = new Map(matches.map(m => [m.id, m]))

  // Column left-x for each round
  const colX = ROUND_IDS.map((_, ri) => ri * (MATCH_W + CONN_W))
  const finalX = ROUND_IDS.length * (MATCH_W + CONN_W)
  const totalW = finalX + MATCH_W

  // Final is vertically centered in the full bracket
  const finalSlotH = SLOT_H * 16
  const m104 = byId.get(104)
  const m103 = byId.get(103)

  return (
    <div className="bracket-scroll">
      {/* ── Round label row ── */}
      <div className="bracket-labels">
        {ROUND_IDS.map((_, ri) => (
          <React.Fragment key={ri}>
            <div className="bracket-col-label" style={{ width: MATCH_W }}>
              {ROUND_LABELS[ri]}
            </div>
            <div style={{ width: CONN_W, flexShrink: 0 }} />
          </React.Fragment>
        ))}
        <div className="bracket-col-label" style={{ width: MATCH_W }}>Final</div>
      </div>

      {/* ── Bracket body ── */}
      <div style={{ position: 'relative', width: totalW, height: TOTAL_H }}>

        {ROUND_IDS.map((ids, ri) => {
          const slotH = SLOT_H * Math.pow(2, ri)
          const x = colX[ri]
          return (
            <React.Fragment key={ri}>
              {/* Match boxes for this round */}
              {ids.map((id, si) => {
                const m = byId.get(id)
                if (!m) return null
                return (
                  <div
                    key={id}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: matchTop(si, slotH),
                      width: MATCH_W,
                      height: MATCH_H,
                    }}
                  >
                    <BracketMatch
                      match={m}
                      groups={groups}
                      slotLabels={SLOT_LABELS[id]}
                    />
                  </div>
                )
              })}

              {/* Connector SVG to the next round */}
              {ri < ROUND_IDS.length - 1 && (
                <div style={{ position: 'absolute', left: x + MATCH_W, top: 0 }}>
                  <Connectors slotH={slotH} count={ids.length} />
                </div>
              )}
            </React.Fragment>
          )
        })}

        {/* Connector from SF → Final */}
        <div style={{ position: 'absolute', left: colX[ROUND_IDS.length - 1] + MATCH_W, top: 0 }}>
          <Connectors slotH={SLOT_H * 8} count={2} />
        </div>

        {/* Final */}
        {m104 && (
          <div
            style={{
              position: 'absolute',
              left: finalX,
              top: matchTop(0, finalSlotH),
              width: MATCH_W,
              height: MATCH_H,
            }}
          >
            <BracketMatch match={m104} groups={groups} slotLabels={SLOT_LABELS[104]} />
          </div>
        )}

        {/* 3rd place — below the Final with a label */}
        {m103 && (
          <div
            style={{
              position: 'absolute',
              left: finalX,
              top: matchTop(0, finalSlotH) + MATCH_H + 32,
            }}
          >
            <div className="bracket-col-label" style={{ marginBottom: 6 }}>3rd Place</div>
            <BracketMatch match={m103} groups={groups} slotLabels={SLOT_LABELS[103]} />
          </div>
        )}
      </div>
    </div>
  )
}
