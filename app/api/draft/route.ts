import { NextResponse } from 'next/server';
import { seasonRosters } from '../../../lib/players';

const random = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export async function POST(request: Request) {
  const { excluded = [], filledSlots = [], previous, reroll = false } = (await request.json()) as {
    excluded: string[]; filledSlots: string[]; previous?: { team: string; season: number }; reroll?: boolean;
  };
  let pools = seasonRosters.filter((pool) => pool.candidates.some((player) => !excluded.includes(player.id)));
  if (reroll && previous) {
    const different = pools.filter((pool) => pool.context.team !== previous.team || pool.context.season !== previous.season);
    if (different.length) pools = different;
  }
  if (!pools.length) return NextResponse.json({ error: '선택 가능한 로스터가 없습니다.' }, { status: 422 });
  const selected = random(pools);
  return NextResponse.json({ context: selected.context, candidates: selected.candidates.filter((player) => !excluded.includes(player.id)), occupiedSlots: filledSlots });
}
