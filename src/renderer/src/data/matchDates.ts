// Pre-formatted match dates in US Eastern Time (EDT, UTC−4).
// Keyed by match ID ("A-1" … "L-6").
// Match order per group: [1] a-b · [2] c-d · [3] a-c · [4] b-d · [5] a-d · [6] b-c

// ISO 8601 UTC strings for chronological sorting — these sort correctly as plain strings.
export const MATCH_SORT_KEY: Record<string, string> = {
  'A-1': '2026-06-19T01:00Z', 'A-2': '2026-06-18T16:00Z', 'A-3': '2026-06-11T19:00Z',
  'A-4': '2026-06-12T02:00Z', 'A-5': '2026-06-25T01:00Z', 'A-6': '2026-06-25T01:00Z',
  'B-1': '2026-06-24T19:00Z', 'B-2': '2026-06-24T19:00Z', 'B-3': '2026-06-12T19:00Z',
  'B-4': '2026-06-13T19:00Z', 'B-5': '2026-06-18T22:00Z', 'B-6': '2026-06-18T19:00Z',
  'C-1': '2026-06-13T22:00Z', 'C-2': '2026-06-14T01:00Z', 'C-3': '2026-06-24T22:00Z',
  'C-4': '2026-06-24T22:00Z', 'C-5': '2026-06-20T00:30Z', 'C-6': '2026-06-19T22:00Z',
  'D-1': '2026-06-13T01:00Z', 'D-2': '2026-06-14T04:00Z', 'D-3': '2026-06-26T02:00Z',
  'D-4': '2026-06-26T02:00Z', 'D-5': '2026-06-19T19:00Z', 'D-6': '2026-06-20T03:00Z',
  'E-1': '2026-06-20T20:00Z', 'E-2': '2026-06-21T00:00Z', 'E-3': '2026-06-25T20:00Z',
  'E-4': '2026-06-25T20:00Z', 'E-5': '2026-06-14T17:00Z', 'E-6': '2026-06-14T23:00Z',
  'F-1': '2026-06-14T20:00Z', 'F-2': '2026-06-15T02:00Z', 'F-3': '2026-06-20T17:00Z',
  'F-4': '2026-06-21T04:00Z', 'F-5': '2026-06-25T23:00Z', 'F-6': '2026-06-25T23:00Z',
  'G-1': '2026-06-21T19:00Z', 'G-2': '2026-06-22T01:00Z', 'G-3': '2026-06-15T19:00Z',
  'G-4': '2026-06-16T01:00Z', 'G-5': '2026-06-27T03:00Z', 'G-6': '2026-06-27T03:00Z',
  'H-1': '2026-06-27T00:00Z', 'H-2': '2026-06-27T00:00Z', 'H-3': '2026-06-21T16:00Z',
  'H-4': '2026-06-21T22:00Z', 'H-5': '2026-06-15T16:00Z', 'H-6': '2026-06-15T22:00Z',
  'I-1': '2026-06-16T19:00Z', 'I-2': '2026-06-16T22:00Z', 'I-3': '2026-06-26T19:00Z',
  'I-4': '2026-06-26T19:00Z', 'I-5': '2026-06-22T21:00Z', 'I-6': '2026-06-23T00:00Z',
  'J-1': '2026-06-17T01:00Z', 'J-2': '2026-06-17T04:00Z', 'J-3': '2026-06-22T17:00Z',
  'J-4': '2026-06-23T03:00Z', 'J-5': '2026-06-28T02:00Z', 'J-6': '2026-06-28T02:00Z',
  'K-1': '2026-06-27T23:30Z', 'K-2': '2026-06-27T23:30Z', 'K-3': '2026-06-17T17:00Z',
  'K-4': '2026-06-18T02:00Z', 'K-5': '2026-06-23T17:00Z', 'K-6': '2026-06-24T02:00Z',
  'L-1': '2026-06-17T20:00Z', 'L-2': '2026-06-17T23:00Z', 'L-3': '2026-06-23T20:00Z',
  'L-4': '2026-06-23T23:00Z', 'L-5': '2026-06-27T21:00Z', 'L-6': '2026-06-27T21:00Z',
}

export const MATCH_DATES: Record<string, string> = {
  // ── Group A: Mexico · South Korea · South Africa · Czechia ──
  'A-1': 'Jun 18 · 9:00 PM ET',   // Mexico vs South Korea
  'A-2': 'Jun 18 · 12:00 PM ET',  // South Africa vs Czechia
  'A-3': 'Jun 11 · 3:00 PM ET',   // Mexico vs South Africa
  'A-4': 'Jun 11 · 10:00 PM ET',  // South Korea vs Czechia
  'A-5': 'Jun 24 · 9:00 PM ET',   // Mexico vs Czechia
  'A-6': 'Jun 24 · 9:00 PM ET',   // South Korea vs South Africa

  // ── Group B: Canada · Switzerland · Bosnia-Herzegovina · Qatar ──
  'B-1': 'Jun 24 · 3:00 PM ET',   // Canada vs Switzerland
  'B-2': 'Jun 24 · 3:00 PM ET',   // Bosnia-Herzegovina vs Qatar
  'B-3': 'Jun 12 · 3:00 PM ET',   // Canada vs Bosnia-Herzegovina
  'B-4': 'Jun 13 · 3:00 PM ET',   // Switzerland vs Qatar
  'B-5': 'Jun 18 · 6:00 PM ET',   // Canada vs Qatar
  'B-6': 'Jun 18 · 3:00 PM ET',   // Switzerland vs Bosnia-Herzegovina

  // ── Group C: Brazil · Morocco · Scotland · Haiti ──
  'C-1': 'Jun 13 · 6:00 PM ET',   // Brazil vs Morocco
  'C-2': 'Jun 13 · 9:00 PM ET',   // Scotland vs Haiti
  'C-3': 'Jun 24 · 6:00 PM ET',   // Brazil vs Scotland
  'C-4': 'Jun 24 · 6:00 PM ET',   // Morocco vs Haiti
  'C-5': 'Jun 19 · 8:30 PM ET',   // Brazil vs Haiti
  'C-6': 'Jun 19 · 6:00 PM ET',   // Morocco vs Scotland

  // ── Group D: United States · Paraguay · Türkiye · Australia ──
  'D-1': 'Jun 12 · 9:00 PM ET',   // United States vs Paraguay
  'D-2': 'Jun 14 · 12:00 AM ET',  // Türkiye vs Australia
  'D-3': 'Jun 25 · 10:00 PM ET',  // United States vs Türkiye
  'D-4': 'Jun 25 · 10:00 PM ET',  // Paraguay vs Australia
  'D-5': 'Jun 19 · 3:00 PM ET',   // United States vs Australia
  'D-6': 'Jun 19 · 11:00 PM ET',  // Paraguay vs Türkiye

  // ── Group E: Germany · Ivory Coast · Ecuador · Curaçao ──
  'E-1': 'Jun 20 · 4:00 PM ET',   // Germany vs Ivory Coast
  'E-2': 'Jun 20 · 8:00 PM ET',   // Ecuador vs Curaçao
  'E-3': 'Jun 25 · 4:00 PM ET',   // Germany vs Ecuador
  'E-4': 'Jun 25 · 4:00 PM ET',   // Ivory Coast vs Curaçao
  'E-5': 'Jun 14 · 1:00 PM ET',   // Germany vs Curaçao
  'E-6': 'Jun 14 · 7:00 PM ET',   // Ivory Coast vs Ecuador

  // ── Group F: Netherlands · Japan · Sweden · Tunisia ──
  'F-1': 'Jun 14 · 4:00 PM ET',   // Netherlands vs Japan
  'F-2': 'Jun 14 · 10:00 PM ET',  // Sweden vs Tunisia
  'F-3': 'Jun 20 · 1:00 PM ET',   // Netherlands vs Sweden
  'F-4': 'Jun 21 · 12:00 AM ET',  // Japan vs Tunisia
  'F-5': 'Jun 25 · 7:00 PM ET',   // Netherlands vs Tunisia
  'F-6': 'Jun 25 · 7:00 PM ET',   // Japan vs Sweden

  // ── Group G: Belgium · Iran · Egypt · New Zealand ──
  'G-1': 'Jun 21 · 3:00 PM ET',   // Belgium vs Iran
  'G-2': 'Jun 21 · 9:00 PM ET',   // Egypt vs New Zealand
  'G-3': 'Jun 15 · 3:00 PM ET',   // Belgium vs Egypt
  'G-4': 'Jun 15 · 9:00 PM ET',   // Iran vs New Zealand
  'G-5': 'Jun 26 · 11:00 PM ET',  // Belgium vs New Zealand
  'G-6': 'Jun 26 · 11:00 PM ET',  // Iran vs Egypt

  // ── Group H: Spain · Uruguay · Saudi Arabia · Cape Verde ──
  'H-1': 'Jun 26 · 8:00 PM ET',   // Spain vs Uruguay
  'H-2': 'Jun 26 · 8:00 PM ET',   // Saudi Arabia vs Cape Verde
  'H-3': 'Jun 21 · 12:00 PM ET',  // Spain vs Saudi Arabia
  'H-4': 'Jun 21 · 6:00 PM ET',   // Uruguay vs Cape Verde
  'H-5': 'Jun 15 · 12:00 PM ET',  // Spain vs Cape Verde
  'H-6': 'Jun 15 · 6:00 PM ET',   // Uruguay vs Saudi Arabia

  // ── Group I: France · Senegal · Norway · Iraq ──
  'I-1': 'Jun 16 · 3:00 PM ET',   // France vs Senegal
  'I-2': 'Jun 16 · 6:00 PM ET',   // Norway vs Iraq
  'I-3': 'Jun 26 · 3:00 PM ET',   // France vs Norway
  'I-4': 'Jun 26 · 3:00 PM ET',   // Senegal vs Iraq
  'I-5': 'Jun 22 · 5:00 PM ET',   // France vs Iraq
  'I-6': 'Jun 22 · 8:00 PM ET',   // Senegal vs Norway

  // ── Group J: Argentina · Algeria · Austria · Jordan ──
  'J-1': 'Jun 16 · 9:00 PM ET',   // Argentina vs Algeria
  'J-2': 'Jun 17 · 12:00 AM ET',  // Austria vs Jordan
  'J-3': 'Jun 22 · 1:00 PM ET',   // Argentina vs Austria
  'J-4': 'Jun 22 · 11:00 PM ET',  // Algeria vs Jordan
  'J-5': 'Jun 27 · 10:00 PM ET',  // Argentina vs Jordan
  'J-6': 'Jun 27 · 10:00 PM ET',  // Algeria vs Austria

  // ── Group K: Portugal · Colombia · DR Congo · Uzbekistan ──
  'K-1': 'Jun 27 · 7:30 PM ET',   // Portugal vs Colombia
  'K-2': 'Jun 27 · 7:30 PM ET',   // DR Congo vs Uzbekistan
  'K-3': 'Jun 17 · 1:00 PM ET',   // Portugal vs DR Congo
  'K-4': 'Jun 17 · 10:00 PM ET',  // Colombia vs Uzbekistan
  'K-5': 'Jun 23 · 1:00 PM ET',   // Portugal vs Uzbekistan
  'K-6': 'Jun 23 · 10:00 PM ET',  // Colombia vs DR Congo

  // ── Group L: England · Croatia · Ghana · Panama ──
  'L-1': 'Jun 17 · 4:00 PM ET',   // England vs Croatia
  'L-2': 'Jun 17 · 7:00 PM ET',   // Ghana vs Panama
  'L-3': 'Jun 23 · 4:00 PM ET',   // England vs Ghana
  'L-4': 'Jun 23 · 7:00 PM ET',   // Croatia vs Panama
  'L-5': 'Jun 27 · 5:00 PM ET',   // England vs Panama
  'L-6': 'Jun 27 · 5:00 PM ET',   // Croatia vs Ghana
}
