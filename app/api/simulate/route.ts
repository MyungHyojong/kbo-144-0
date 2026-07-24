import { NextResponse } from 'next/server';
import type { Player } from '../../../lib/players';

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
  const wins = Math.min(144, Math.max(75, Math.round(66 + (rating - 78) * 2.8 + (Math.random() - 0.5) * 4)));
  const chance = Math.min(42, Math.max(0.1, ((wins - 110) ** 2) / 34 + (rating - 87) * 1.5));
  return NextResponse.json({ rating: rating.toFixed(1), wins, losses: 144 - wins, chance: chance.toFixed(1), traits, summary: [`팀 종합 레이팅 ${rating.toFixed(1)}`, `외국인 선수 ${roster.filter((player) => player.foreign).length}/3명`, '선발 4명 · 불펜 3명 구성 완료'] });
}
