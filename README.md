# 2026 World Cup Game Tracker

**Live site:** https://pages.github.cainc.com/KMeserve/world-cup-tracker/

A personal desktop app for tracking the 2026 FIFA World Cup group stage, built with Electron + React + TypeScript. Built around a specific goal: tracking who will be playing in the **June 29th Round of 32 game** at Gillette Stadium — Group E 1st place vs. a 3rd-place team from Groups A, B, C, D, or F.

Scores sync automatically from ESPN every 60 seconds (30 seconds during live matches).

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node)

## Getting started

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd world-cup-game-tracker

# 2. Install dependencies
npm install

# 3. Run in development mode (opens the Electron window + hot reload)
npm run dev
```

The app opens automatically and starts syncing scores from ESPN.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start in development mode with hot reload |
| `npm run build` | Compile production JS/CSS into `out/` |
| `npm run dist:mac` | Build + package a `.dmg` installer for macOS (arm64 + x64) |
| `npm run dist:win` | Build + package a `.exe` NSIS installer for Windows (x64) |
| `npm run dist` | Build + package for the current platform |

## Installing on Mac or Windows

### macOS

```bash
npm run dist:mac
# Creates dist/World Cup Tracker-1.0.0-arm64.dmg  (Apple Silicon)
# and   dist/World Cup Tracker-1.0.0.dmg           (Intel)
```

Open the `.dmg`, drag **World Cup Tracker** to your Applications folder, and launch it.

> **Note:** The app is ad-hoc signed but not notarized. On first launch, right-click → **Open** to bypass Gatekeeper.

### Windows

```bash
npm run dist:win
# Creates dist/World Cup Tracker Setup 1.0.0.exe
```

Run the installer — it creates Start Menu and Desktop shortcuts automatically.

> **Note:** Windows may show a SmartScreen warning. Click **More info → Run anyway**.

---

## Features

### Header — Your Game
The top banner always shows who is projected to play in the June 29th match at Gillette Stadium (Group E 1st place vs. the qualifying 3rd-place team). Teams lock in once they've mathematically clinched their position.

### Jun 29 Simulation — "Who You Might Watch"
A collapsible panel that runs 10,000 simulated tournaments to project:
- **P(Group E team finishes 1st)** — who the home team will be
- **P(each 3rd-place team is specifically the Jun 29 opponent)** — accounting for which groups are eligible and how many qualify per simulation

The simulation runs once on load, re-runs automatically when a match result comes in, and can be manually triggered with the **↻ Recalculate** button.

### Live game cards
When a match is in progress, a live card appears showing:
- Real-time score and match clock
- Goal scorers, yellow/red cards
- Team stats (possession, shots, passes, etc.) with animated bars
- A pitch map showing territorial control, animating smoothly as the game progresses
- **Match implications** — what the current result (and other possible outcomes) would mean for each team: clinching a position or elimination. The message matching the current scoreline is **bolded**.
- Team colors fade in from each side of the card background

### Pre-game cards
In the hour before kickoff, a card appears with:
- Countdown to kickoff
- Win probability for each team, calculated from FIFA rankings + tournament form (not gambling odds)
- The same team-color gradient background

### Win probability modal
Click any unplayed match — in a group card or in the bracket — to see a win probability breakdown (home / draw / away) using a Bradley-Terry model adjusted for tournament form.

### Group standings
Each group card shows a full standings table with:
- **✓ Clinched** — a gold checkmark next to a team when they've mathematically locked in their position (can't rise higher or fall lower)
- **Greyed out** — teams that are mathematically eliminated from advancing
- **Live indicator** — rows pulse red when a team is currently playing
- **Upset flag** — matches where a significantly lower-ranked team wins (or draws when the gap is extreme) are highlighted

### Top 8 Third Place tracker
A collapsible table ranking all 12 third-place teams. The best 8 advance; a cutline separates them. Teams from Groups A/B/C/D/F (potential Jun 29 opponents) are highlighted with a gold border and 📍 badge, and show their simulated probability of being specifically your Jun 29 opponent.

### Knockout bracket
The full Round of 32 through Final bracket. Slots fill in from group results. A team is shown as locked (green border + ✓) once they've mathematically clinched that position. Click any match with two known teams to see win probability.

### Color coding

| Style | Meaning |
|---|---|
| 🟢 Green row | Advancing to Round of 32 (1st or 2nd place) |
| 🟡 Gold row | Currently in 3rd place |
| ⬜ Dim row | 4th place |
| Greyed + strikethrough | Mathematically eliminated |
| ✓ Gold checkmark | Clinched this position |
| Blue card border | **Group E** — their 1st place is in your game |
| Green card border | **Groups A, B, C, D, F** — their 3rd place could be in your game |

### Other controls
- **⟳ ESPN Live** — manual sync button; shows last sync time
- **↺** on each group card — reset that group's data
- **🎆** — trigger fireworks (also fires automatically on goals)
- **☀️ / 🌙** — toggle light/dark theme (persists across restarts)

---

## How syncing works

The app polls ESPN's public soccer API (no API key required) on a 60-second interval, dropping to 30 seconds when any match is live. Scores, match clocks, events (goals, cards), team stats, and team colors all come from this feed.

ESPN's home/away orientation doesn't always match the fixture list, so the app detects mismatches and flips stats and events accordingly.

---

## Project structure

```
src/
├── main/                   Electron main process
├── preload/                Electron preload bridge
└── renderer/src/
    ├── components/
    │   ├── App.tsx           Root layout
    │   ├── GroupCard.tsx     Group standings + match list
    │   ├── LiveGames.tsx     Live + pre-game cards
    │   ├── GamePreview.tsx   "Who You Might Watch" simulation panel
    │   ├── BracketView.tsx   Knockout bracket layout
    │   ├── BracketMatch.tsx  Individual bracket match tile
    │   ├── MatchOddsModal.tsx Win probability modal
    │   ├── ThirdPlaceTracker.tsx Top 8 third-place table
    │   └── Fireworks.tsx     Goal celebration animation
    ├── data/               Static 2026 WC group/team/schedule data
    ├── hooks/              useSimulation hook
    ├── services/           ESPN API fetch + data parsing
    ├── store/              useStore — global state + auto-sync
    └── utils/
        ├── standings.ts    computeStandings, getClinched, isMathEliminated, getMatchImplications
        ├── simulation.ts   Bradley-Terry model, tournament simulation
        └── bracket.ts      Bracket resolution logic
```

## Data source

Live scores are pulled from ESPN's undocumented public API — the same data that powers ESPN.com:

```
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
```
