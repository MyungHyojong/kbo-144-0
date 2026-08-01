import { NextResponse } from 'next/server';
import type { Player } from '../../../lib/players';

// Reduced client-safe form of the trained Ridge model. Variables not available
// from the draft roster stay at their historical average; selected-player values
// below are standardized with the original model's mean and scale.
const RIDGE_INTERCEPT = 0.4992065217391304;
// Top 50 of 214 historical team-seasons pass this full-model calibration line.
const RIDGE_144_THRESHOLD = 0.47;
const ridgeTerms = [
  ['bat_R', 437.2826086956522, 88.3940444195585, 0.02650877009548392],
  ['bat_RBI', 411.42934782608694, 91.85589734924775, 0.012729296559971848],
  ['bat_HBP', 36.90217391304348, 22.91646445462714, 0.011290749425177321],
  ['team_avg', 0.2809108296690099, 0.015039718470122141, 0.00997976892003397],
  ['team_slg', 0.42113846716354747, 0.039467047025008896, 0.011436867831877603],
  ['team_ops', 0.7618342845715828, 0.0576780982397434, 0.011974216562036342],
  ['def_G', 907.5760869565217, 74.58234924880483, 0.012606447746546857],
  ['pit_ER', 340.3152173913044, 50.434294178669404, -0.013315103428066358],
  ['pit_HLD', 30.08695652173913, 11.855242991580308, 0.011789389223912736],
  ['pit_outs', 2252.179347826087, 199.0934492393194, 0.011193159055395726],
  ['team_era', 4.0958641158900715, 0.6115218294288309, -0.015691042100397828],
  ['bullpen_era', 3.853160552960682, 0.835611845974024, -0.011967152914072882],
] as const;

function sum(players: Player[], key: string) { return players.reduce((total, player) => total + (player.metrics[key] || 0), 0); }

function ridgeWinPct(roster: Player[]) {
  const hitters = roster.filter((player) => player.type === 'hitter');
  const pitchers = roster.filter((player) => player.type === 'pitcher');
  const bullpen = roster.filter((player) => player.slot.startsWith('RP'));
  const h = sum(hitters, 'H'); const ab = sum(hitters, 'AB'); const bb = sum(hitters, 'BB');
  const hbp = sum(hitters, 'HBP'); const sf = sum(hitters, 'SF'); const tb = sum(hitters, 'TB');
  const outs = sum(pitchers, 'outs'); const bullpenOuts = sum(bullpen, 'outs');
  const values: Record<string, number> = {
    bat_R: sum(hitters, 'R'), bat_RBI: sum(hitters, 'RBI'), bat_HBP: hbp, team_avg: ab ? h / ab : 0,
    team_slg: ab ? tb / ab : 0, team_ops: ab ? tb / ab + (h + bb + hbp) / (ab + bb + hbp + sf) : 0,
    def_G: sum(hitters, 'defG'), pit_ER: sum(pitchers, 'ER'), pit_HLD: sum(pitchers, 'HLD'), pit_outs: outs,
    team_era: outs ? sum(pitchers, 'ER') * 27 / outs : 9.99, bullpen_era: bullpenOuts ? sum(bullpen, 'ER') * 27 / bullpenOuts : 9.99,
  };
  return ridgeTerms.reduce((total, [key, mean, scale, coefficient]) => total + ((values[key] - mean) / scale) * coefficient, RIDGE_INTERCEPT);
}

function predictWins(roster: Player[]) {
  // Preserve Ridge ordering while using a friendlier all-time-draft conversion.
  // Calibrated so the 2015 Samsung historical top roster (ridge ≈ 0.7095)
  // projects to about 120 wins, while preserving the Ridge ranking.
  return Math.round(Math.max(82, Math.min(140, 100 + (ridgeWinPct(roster) - 0.5) * 95)));
}

export async function POST(req: Request) {
  const { roster } = (await req.json()) as { roster: Player[] };
  if (!roster || roster.length !== 16) return NextResponse.json({ error: '16명 로스터가 필요합니다.' }, { status: 400 });
  const rating = roster.reduce((total, player) => total + player.score, 0) / 16;
  const hitters = roster.filter((player) => player.type === 'hitter');
  const starters = roster.filter((player) => player.slot.startsWith('SP'));
  const bullpen = roster.filter((player) => player.slot.startsWith('RP'));
  const average = (items: Player[]) => items.reduce((total, player) => total + player.score, 0) / items.length;
  const clamp = (value: number) => Math.round(Math.min(99, Math.max(52, value)));
  const traits = {
    '타격': clamp(average(hitters) + 2), '수비': clamp(average(hitters) - 1), '선발': clamp(average(starters) + 1),
    '불펜': clamp(average(bullpen) + 2), '주루': clamp(average(hitters) - 3), '조화': clamp(rating + 1),
  };
  const baseWins = predictWins(roster);
  // Keep repeated simulations nearly deterministic: only a small ±2-game swing.
  const wins = Math.max(82, Math.min(144, baseWins + Math.round((Math.random() - 0.5) * 4)));
  // Undefeated seasons must remain a rare end-game outcome.
  const chance = Math.min(0.5, Math.max(0.01, (ridgeWinPct(roster) - RIDGE_144_THRESHOLD) * 2.1));
  return NextResponse.json({ rating: rating.toFixed(1), wins, losses: 144 - wins, chance: chance.toFixed(1), traits, summary: [`팀 종합 레이팅 ${rating.toFixed(1)}`, `외국인 선수 ${roster.filter((player) => player.foreign).length}/3명`, '선발 4명 · 불펜 3명 구성 완료'] });
}
