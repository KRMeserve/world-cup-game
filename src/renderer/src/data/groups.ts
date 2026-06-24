import { Group } from '../types'

function makeMatches(groupId: string, teams: string[]) {
  const [a, b, c, d] = teams
  return [
    { id: `${groupId}-1`, homeTeam: a, awayTeam: b, homeScore: null, awayScore: null, played: false },
    { id: `${groupId}-2`, homeTeam: c, awayTeam: d, homeScore: null, awayScore: null, played: false },
    { id: `${groupId}-3`, homeTeam: a, awayTeam: c, homeScore: null, awayScore: null, played: false },
    { id: `${groupId}-4`, homeTeam: b, awayTeam: d, homeScore: null, awayScore: null, played: false },
    { id: `${groupId}-5`, homeTeam: a, awayTeam: d, homeScore: null, awayScore: null, played: false },
    { id: `${groupId}-6`, homeTeam: b, awayTeam: c, homeScore: null, awayScore: null, played: false },
  ]
}

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'A',
    teams: [
      { name: 'Mexico', flag: '🇲🇽' },
      { name: 'South Korea', flag: '🇰🇷' },
      { name: 'South Africa', flag: '🇿🇦' },
      { name: 'Czechia', flag: '🇨🇿' },
    ],
    matches: makeMatches('A', ['Mexico', 'South Korea', 'South Africa', 'Czechia']),
  },
  {
    id: 'B',
    teams: [
      { name: 'Canada', flag: '🇨🇦' },
      { name: 'Switzerland', flag: '🇨🇭' },
      { name: 'Bosnia-Herzegovina', flag: '🇧🇦' },
      { name: 'Qatar', flag: '🇶🇦' },
    ],
    matches: makeMatches('B', ['Canada', 'Switzerland', 'Bosnia-Herzegovina', 'Qatar']),
  },
  {
    id: 'C',
    teams: [
      { name: 'Brazil', flag: '🇧🇷' },
      { name: 'Morocco', flag: '🇲🇦' },
      { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
      { name: 'Haiti', flag: '🇭🇹' },
    ],
    matches: makeMatches('C', ['Brazil', 'Morocco', 'Scotland', 'Haiti']),
  },
  {
    id: 'D',
    teams: [
      { name: 'United States', flag: '🇺🇸' },
      { name: 'Paraguay', flag: '🇵🇾' },
      { name: 'Türkiye', flag: '🇹🇷' },
      { name: 'Australia', flag: '🇦🇺' },
    ],
    matches: makeMatches('D', ['United States', 'Paraguay', 'Türkiye', 'Australia']),
  },
  {
    id: 'E',
    teams: [
      { name: 'Germany', flag: '🇩🇪' },
      { name: 'Ivory Coast', flag: '🇨🇮' },
      { name: 'Ecuador', flag: '🇪🇨' },
      { name: 'Curaçao', flag: '🇨🇼' },
    ],
    matches: makeMatches('E', ['Germany', 'Ivory Coast', 'Ecuador', 'Curaçao']),
  },
  {
    id: 'F',
    teams: [
      { name: 'Netherlands', flag: '🇳🇱' },
      { name: 'Japan', flag: '🇯🇵' },
      { name: 'Sweden', flag: '🇸🇪' },
      { name: 'Tunisia', flag: '🇹🇳' },
    ],
    matches: makeMatches('F', ['Netherlands', 'Japan', 'Sweden', 'Tunisia']),
  },
  {
    id: 'G',
    teams: [
      { name: 'Belgium', flag: '🇧🇪' },
      { name: 'Iran', flag: '🇮🇷' },
      { name: 'Egypt', flag: '🇪🇬' },
      { name: 'New Zealand', flag: '🇳🇿' },
    ],
    matches: makeMatches('G', ['Belgium', 'Iran', 'Egypt', 'New Zealand']),
  },
  {
    id: 'H',
    teams: [
      { name: 'Spain', flag: '🇪🇸' },
      { name: 'Uruguay', flag: '🇺🇾' },
      { name: 'Saudi Arabia', flag: '🇸🇦' },
      { name: 'Cape Verde', flag: '🇨🇻' },
    ],
    matches: makeMatches('H', ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde']),
  },
  {
    id: 'I',
    teams: [
      { name: 'France', flag: '🇫🇷' },
      { name: 'Senegal', flag: '🇸🇳' },
      { name: 'Norway', flag: '🇳🇴' },
      { name: 'Iraq', flag: '🇮🇶' },
    ],
    matches: makeMatches('I', ['France', 'Senegal', 'Norway', 'Iraq']),
  },
  {
    id: 'J',
    teams: [
      { name: 'Argentina', flag: '🇦🇷' },
      { name: 'Algeria', flag: '🇩🇿' },
      { name: 'Austria', flag: '🇦🇹' },
      { name: 'Jordan', flag: '🇯🇴' },
    ],
    matches: makeMatches('J', ['Argentina', 'Algeria', 'Austria', 'Jordan']),
  },
  {
    id: 'K',
    teams: [
      { name: 'Portugal', flag: '🇵🇹' },
      { name: 'Colombia', flag: '🇨🇴' },
      { name: 'DR Congo', flag: '🇨🇩' },
      { name: 'Uzbekistan', flag: '🇺🇿' },
    ],
    matches: makeMatches('K', ['Portugal', 'Colombia', 'DR Congo', 'Uzbekistan']),
  },
  {
    id: 'L',
    teams: [
      { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { name: 'Croatia', flag: '🇭🇷' },
      { name: 'Ghana', flag: '🇬🇭' },
      { name: 'Panama', flag: '🇵🇦' },
    ],
    matches: makeMatches('L', ['England', 'Croatia', 'Ghana', 'Panama']),
  },
]
