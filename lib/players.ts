import hitterData from './hitter_defense_stats.json';
import pitcherData from './pitcher_stats.json';

export type Slot = 'C' | '1B' | '2B' | 'SS' | '3B' | 'LF' | 'CF' | 'RF' | 'DH' | 'SP1' | 'SP2' | 'SP3' | 'SP4' | 'RP1' | 'RP2' | 'RP3';
export type Player = {
  id: string;
  name: string;
  slot: Slot;
  slots: Slot[];
  team: string;
  season: number;
  foreign: boolean;
  type: 'hitter' | 'pitcher';
  line: string;
  score: number;
  appearances: number;
  primaryPosition: string;
  secondaryPosition?: string;
  metrics: Record<string, number>;
};

export const slotOrder: Slot[] = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH', 'SP1', 'SP2', 'SP3', 'SP4', 'RP1', 'RP2', 'RP3'];

type HitterRow = { season: number; team: string; teamCode: string; id: string; name: string; foreign: boolean; games: number; avg: string; homers: string; rbi: string; ops?: string; primary: string; secondary?: string; raw: string[] };
type PitcherRow = { season: number; team: string; teamCode: string; id: string; name: string; foreign: boolean; games: number; era: string; wins: string; saves: string; holds: string; starts: number; role: string; raw: string[] };

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted;
    } else if (character === ',' && !quoted) { cells.push(value); value = ''; } else value += character;
  }
  cells.push(value);
  return cells;
}

function csvRows(filename: string) {
  return (filename.startsWith('hitter') ? hitterData : pitcherData) as string[][];
}

function number(value: string | undefined) {
  const parsed = Number((value || '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fixed(value: string | undefined, digits: number, fallback = 0) {
  const parsed = number(value);
  return (Number.isFinite(parsed) ? parsed : fallback).toFixed(digits);
}

function positionSlots(position?: string): Slot[] {
  switch (position) {
    case '포수': return ['C'];
    case '1루수': return ['1B'];
    case '2루수': return ['2B'];
    case '3루수': return ['3B'];
    case '유격수': return ['SS'];
    case '외야수': return ['LF', 'CF', 'RF'];
    case '지명타자': return ['DH'];
    default: return [];
  }
}

const hitterRows: HitterRow[] = csvRows('hitter_defense_stats_foreign.csv').slice(1).map((row) => ({
  season: number(row[0]), team: row[1], teamCode: row[2], foreign: row[4] === '1', name: row[5], id: row[6],
  games: number(row[9]), avg: fixed(row[8], 3), homers: row[16], rbi: row[18], ops: row[28] === '-' ? undefined : fixed(row[28], 3),
  primary: row[33], secondary: row[47] || undefined, raw: row,
})).filter((row) => row.season && row.games >= 1 && number(row.raw[10]) >= 1 && row.name && positionSlots(row.primary).length > 0);

const pitcherRows: PitcherRow[] = csvRows('pitcher_stats_foreign.csv').slice(1).map((row) => ({
  season: number(row[0]), team: row[1], teamCode: row[2], name: row[3], foreign: row[5] === '1', id: row[6],
  games: number(row[9]), era: fixed(row[8], 2, 9.99), wins: row[10], saves: row[12], holds: row[13],
  starts: number(row[38]), role: row[49], raw: row,
})).filter((row) => row.season && row.games >= 1 && row.name);

function hitterScore(row: HitterRow) {
  const ops = number(row.ops);
  if (!row.ops) return Math.max(55, Math.min(99, Math.round(46 + number(row.avg) * 120 + number(row.homers) * 0.55 + Math.min(row.games, 144) * 0.08)));
  return Math.max(55, Math.min(99, Math.round(54 + ops * 38 + Math.min(row.games, 144) * 0.08)));
}

function pitcherScore(row: PitcherRow) {
  const era = number(row.era) || 9.99;
  return Math.max(55, Math.min(99, Math.round(93 - era * 4 + Math.min(row.games, 75) * 0.12 + row.starts * 0.15)));
}

function inningsToOuts(value: string | undefined) {
  const [whole = '0', fraction = ''] = (value || '0').split('.');
  return number(whole) * 3 + (fraction === '1' ? 1 : fraction === '2' ? 2 : 0);
}

function hitterMetrics(row: HitterRow) {
  const raw = row.raw;
  return { R: number(raw[12]), RBI: number(raw[18]), HBP: number(raw[23]), H: number(raw[13]), AB: number(raw[11]), BB: number(raw[21]), SF: number(raw[20]), TB: number(raw[17]), defG: number(raw[34]) + number(raw[48]) };
}

function pitcherMetrics(row: PitcherRow) {
  const raw = row.raw;
  return { ER: number(raw[22]), HLD: number(raw[13]), outs: inningsToOuts(raw[15]) };
}

function hitterPlayer(row: HitterRow, slots: Slot[]): Player {
  const secondarySlots = positionSlots(row.secondary);
  const eligible = [...new Set([...slots, ...secondarySlots])];
  return {
    id: `${row.season}-${row.teamCode}-H-${row.id}`, name: row.name, slot: slots[0], slots: eligible, team: row.team, season: row.season,
    foreign: row.foreign, type: 'hitter', appearances: row.games, primaryPosition: row.primary, secondaryPosition: row.secondary,
    line: row.ops ? `타율 ${row.avg} / 홈런 ${row.homers} / 타점 ${row.rbi} / OPS ${row.ops}` : `타율 ${row.avg} / 홈런 ${row.homers} / 타점 ${row.rbi}`, score: hitterScore(row), metrics: hitterMetrics(row),
  };
}

function pitcherPlayer(row: PitcherRow, slots: Slot[]): Player {
  return {
    id: `${row.season}-${row.teamCode}-P-${row.id}`, name: row.name, slot: slots[0], slots, team: row.team, season: row.season,
    foreign: row.foreign, type: 'pitcher', appearances: row.games, primaryPosition: row.role || (row.starts > 0 ? '선발' : '불펜'),
    line: `평균자책 ${row.era} / 승 ${row.wins} / 세이브 ${row.saves} / 홀드 ${row.holds}`, score: pitcherScore(row), metrics: pitcherMetrics(row),
  };
}

function makeRoster(season: number, teamCode: string) {
  const hitters = hitterRows.filter((row) => row.season === season && row.teamCode === teamCode).sort((a, b) => b.games - a.games || number(b.ops) - number(a.ops));
  const pitchers = pitcherRows.filter((row) => row.season === season && row.teamCode === teamCode).sort((a, b) => b.games - a.games || number(a.era) - number(b.era));
  const team = hitters[0]?.team || pitchers[0]?.team || teamCode;
  const candidates = new Map<string, Player>();

  const addHitter = (row: HitterRow, slots: Slot[]) => {
    const key = `${row.season}-${row.teamCode}-H-${row.id}`;
    const current = candidates.get(key);
    if (current) current.slots = [...new Set([...current.slots, ...slots, ...positionSlots(row.secondary)])];
    else candidates.set(key, hitterPlayer(row, slots));
  };
  const addPitcher = (row: PitcherRow, slots: Slot[]) => {
    const key = `${row.season}-${row.teamCode}-P-${row.id}`;
    if (!candidates.has(key)) candidates.set(key, pitcherPlayer(row, slots));
  };

  const hitterTargets: Array<[string, Slot[], number]> = [
    ['포수', ['C'], 1], ['1루수', ['1B'], 1], ['2루수', ['2B'], 1], ['3루수', ['3B'], 1], ['유격수', ['SS'], 1], ['외야수', ['LF', 'CF', 'RF'], 3], ['지명타자', ['DH'], 1],
  ];
  for (const [position, slots, amount] of hitterTargets) {
    const ranked = hitters.filter((row) => row.primary === position);
    const chosen = ranked.slice(0, amount);
    // Keep every ranked hitter in the team-season pool. The draft API selects
    // the highest eligible names and can therefore replace a previously used ID.
    ranked.forEach((row) => addHitter(row, slots));
    // A foreign top-ranked hitter is displayed with the next domestic player at that position as a selectable backup.
    if (chosen.some((row) => row.foreign)) {
      const domestic = ranked.find((row) => !row.foreign && !chosen.some((picked) => picked.id === row.id));
      if (domestic) addHitter(domestic, slots);
    }
  }

  // The source already classifies each pitcher as starter or bullpen. A reliever
  // can have a handful of starts, so GS alone must not decide the role here.
  const starters = pitchers.filter((row) => row.role === '선발');
  const starterCount = starters.length >= 4 ? 4 : Math.min(3, starters.length);
  const selectedStarters = starters.slice(0, starterCount);
  selectedStarters.forEach((row) => addPitcher(row, ['SP1', 'SP2', 'SP3', 'SP4']));

  // Always expose the top three pitchers already classified as bullpen.
  const bullpen = pitchers.filter((row) => row.role === '불펜').slice(0, 3);
  bullpen.forEach((row) => addPitcher(row, ['RP1', 'RP2', 'RP3']));

  return { context: { team, season }, candidates: [...candidates.values()] };
}

const teamSeasons = new Map<string, { season: number; teamCode: string }>();
[...hitterRows, ...pitcherRows].forEach((row) => teamSeasons.set(`${row.season}-${row.teamCode}`, { season: row.season, teamCode: row.teamCode }));

export const seasonRosters = [...teamSeasons.values()].map(({ season, teamCode }) => makeRoster(season, teamCode)).filter((roster) => roster.candidates.length > 0);
