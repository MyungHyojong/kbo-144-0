import { NextResponse } from 'next/server';
import { seasonRosters } from '../../../lib/players';

const random = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export async function POST(request: Request) {
  const { excluded = [], filledSlots = [], previous, reroll = false, dhMode = false } = (await request.json()) as {
    excluded: string[]; filledSlots: string[]; previous?: { team: string; season: number }; reroll?: boolean; dhMode?: boolean;
  };
  let pools = seasonRosters.filter((pool) => pool.candidates.some((player) => !excluded.includes(player.id)));
  if (reroll && previous) {
    const different = pools.filter((pool) => pool.context.team !== previous.team || pool.context.season !== previous.season);
    if (different.length) pools = different;
  }
  if (dhMode && previous) {
    const sameRoster = pools.filter((pool) => pool.context.team === previous.team && pool.context.season === previous.season);
    if (sameRoster.length) pools = sameRoster;
  }
  if (!pools.length) return NextResponse.json({ error: '선택 가능한 로스터가 없습니다.' }, { status: 422 });
  const selected = random(pools);
  const available = selected.candidates.filter((player) => !excluded.includes(player.id));
  const pitchers = available.filter((player) => player.type === 'pitcher');
  const hitters = available.filter((player) => player.type === 'hitter');
  if (dhMode) return NextResponse.json({ context: selected.context, candidates: hitters, occupiedSlots: filledSlots, dhMode: true });

  const targets: Array<[string, number]> = [['포수', 1], ['1루수', 1], ['2루수', 1], ['3루수', 1], ['유격수', 1], ['외야수', 3]];
  const selectedHitters = targets.flatMap(([position, count]) => {
    const ranked = hitters.filter((player) => player.primaryPosition === position).sort((a, b) => b.appearances - a.appearances);
    const picked = ranked.slice(0, count);
    const domesticBackup = picked.some((player) => player.foreign) ? ranked.find((player) => !player.foreign && !picked.some((choice) => choice.id === player.id)) : undefined;
    return domesticBackup ? [...picked, domesticBackup] : picked;
  });
  return NextResponse.json({ context: selected.context, candidates: [...selectedHitters, ...pitchers], occupiedSlots: filledSlots, dhMode: false });
}
