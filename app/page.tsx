'use client';

import { useMemo, useState } from 'react';
import type { Player, Slot } from '../lib/players';

const fieldSlots: Slot[] = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH'];
const pitchSlots: Slot[] = ['SP1', 'SP2', 'SP3', 'SP4', 'RP1', 'RP2', 'RP3'];
const outfieldSlots: Slot[] = ['LF', 'CF', 'RF'];
const starterSlots: Slot[] = ['SP1', 'SP2', 'SP3', 'SP4'];
const bullpenSlots: Slot[] = ['RP1', 'RP2', 'RP3'];
const SITE_VERSION = 'DEMO v0.1.7';
const LAST_UPDATED = '2026.08.01 21:05 KST';
const MODEL_LEADERBOARD = [
  ['2015 삼성', 125], ['2016 두산', 124], ['2017 KIA', 124], ['2019 키움', 124], ['2015 NC', 123],
  ['2002 삼성', 120], ['2003 삼성', 120], ['2022 LG', 119], ['2024 KIA', 119], ['2023 LG', 118],
];

const slotLabels: Record<Slot, string> = {
  C: '포수', '1B': '1루수', '2B': '2루수', SS: '유격수', '3B': '3루수',
  LF: '외야수', CF: '외야수', RF: '외야수', DH: '지명타자',
  SP1: '선발', SP2: '선발', SP3: '선발', SP4: '선발', RP1: '불펜', RP2: '불펜', RP3: '불펜',
};
const slotGroups: Record<Slot, string> = {
  C: '내야', '1B': '내야', '2B': '내야', SS: '내야', '3B': '내야',
  LF: '외야', CF: '외야', RF: '외야', DH: '타격',
  SP1: '투수', SP2: '투수', SP3: '투수', SP4: '투수', RP1: '투수', RP2: '투수', RP3: '투수',
};

type Offer = { context: { team: string; season: number }; candidates: Player[] };
type Result = { wins: number; losses: number; chance: string; rating: string; summary: string[]; traits: Record<string, number> };

const isOutfield = (slot: Slot) => outfieldSlots.includes(slot);
const isStarter = (slot: Slot) => starterSlots.includes(slot);
const isBullpen = (slot: Slot) => bullpenSlots.includes(slot);
const firstOpen = (roster: Record<string, Player>, slots: Slot[]) => slots.find((slot) => !roster[slot]);
const seasonName = (player: Player) => `${String(player.season).slice(-2)}-${String((player.season + 1) % 100).padStart(2, '0')} ${player.name}`;

function SpiderChart({ traits }: { traits: Record<string, number> }) {
  const labels = ['타격', '수비', '선발', '불펜', '주루', '조화'];
  // Expand the visual range so differences between strong all-star teams stay legible.
  const values = labels.map((label) => Math.min(100, 55 + (traits[label] ?? 0) * 0.45));
  const polar = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
    const radius = (value / 100) * 94;
    return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`;
  };
  const grid = (radius: number) => Array.from({ length: 6 }, (_, index) => polar(index, radius));
  const labelPoint = (index: number) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
    return { x: 100 + Math.cos(angle) * 108, y: 100 + Math.sin(angle) * 108 };
  };

  return <div className="spider-wrap"><svg className="spider" viewBox="-20 -20 240 240" role="img" aria-label="팀 능력치 육각형 그래프">
    {[25, 50, 75, 100].map((radius) => <polygon key={radius} points={grid(radius).join(' ')} className="spider-grid" />)}
    {Array.from({ length: 6 }, (_, index) => <line key={index} x1="100" y1="100" x2={polar(index, 100).split(',')[0]} y2={polar(index, 100).split(',')[1]} className="spider-axis" />)}
    <polygon points={values.map(polar).join(' ')} className="spider-data" />
    {values.map((value, index) => <circle key={index} cx={polar(index, value).split(',')[0]} cy={polar(index, value).split(',')[1]} r="3" className="spider-dot" />)}
    {labels.map((label, index) => { const p = labelPoint(index); return <text key={label} x={p.x} y={p.y} className="spider-label">{label}</text>; })}
  </svg></div>;
}

export default function Home() {
  const [mode, setMode] = useState<'classic' | 'iq'>('classic');
  const [roster, setRoster] = useState<Record<string, Player>>({});
  const [offer, setOffer] = useState<Offer | null>(null);
  const [rerolls, setRerolls] = useState(2);
  const [dhMode, setDhMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const selected = Object.values(roster);
  const foreign = useMemo(() => selected.filter((player) => player.foreign).length, [selected]);
  const outfieldCount = outfieldSlots.filter((slot) => roster[slot]).length;
  const starterCount = starterSlots.filter((slot) => roster[slot]).length;
  const bullpenCount = bullpenSlots.filter((slot) => roster[slot]).length;
  const complete = selected.length === 16;

  function restart(nextMode = mode) {
    setMode(nextMode);
    setRoster({});
    setOffer(null);
    setRerolls(2);
    setDhMode(false);
    setResult(null);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function spin(reroll = false, nextDhMode = false) {
    if (loading || (reroll && rerolls <= 0)) return;
    if (reroll) setRerolls((value) => Math.max(0, value - 1));
    setLoading(true);
    const response = await fetch('/api/draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excluded: selected.map((player) => player.id), filledSlots: Object.keys(roster), previous: offer?.context, reroll, dhMode: nextDhMode }),
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) { setOffer(data); setDhMode(nextDhMode); }
  }

  function choose(player: Player) {
    if (player.foreign && foreign >= 3) return;
    const next = { ...roster };
    const target = dhMode ? (!next.DH ? 'DH' : undefined) : availableSlotFor(player, next);
    if (!target) return;
    next[target] = { ...player, slot: target };
    setRoster(next); setOffer(null); setDhMode(false); setResult(null);
  }

  function availableSlotFor(player: Player, currentRoster = roster): Slot | undefined {
    const eligibleSlots = player.slots?.length ? player.slots : [player.slot];
    for (const slot of eligibleSlots) {
      if (isOutfield(slot)) {
        const open = firstOpen(currentRoster, outfieldSlots);
        if (open) return open;
      } else if (isStarter(slot)) {
        const open = firstOpen(currentRoster, starterSlots);
        if (open) return open;
      } else if (isBullpen(slot)) {
        const open = firstOpen(currentRoster, bullpenSlots);
        if (open) return open;
      } else if (!currentRoster[slot]) return slot;
    }
    return undefined;
  }

  async function simulate() {
    if (!complete || loading) return;
    setLoading(true);
    const response = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roster: selected }) });
    setResult(await response.json()); setLoading(false);
    setTimeout(() => document.querySelector('.result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  const marker = (slot: Slot) => {
    const player = roster[slot];
    return <div className={`field-marker marker-${slot} ${player ? 'picked' : ''}`} key={slot}><span>{slotLabels[slot]}</span><b>{player ? seasonName(player) : '빈 자리'}</b></div>;
  };

  const renderCandidate = (player: Player) => {
    const occupied = (dhMode ? Boolean(roster.DH) : !availableSlotFor(player)) || (player.foreign && foreign >= 3);
    return <button className={`player ${player.foreign ? 'foreign-player' : ''} ${dhMode && player.type === 'hitter' ? 'dh-choice' : ''} ${occupied ? 'occupied' : ''}`} key={player.id} disabled={occupied} onClick={() => choose(player)}>
      <span className="position-list"><span>{player.primaryPosition}</span>{player.secondaryPosition && <><span className="position-separator"> | </span><span className="position-secondary">{player.secondaryPosition}</span></>}{player.foreign ? ' · 외국인' : ''}</span><b>{player.name}</b><small>{mode === 'classic' ? player.line : '기록 비공개 · 선수 이름과 포지션만 보고 선택'}</small>
    </button>;
  };

  return <main>
    <nav><a className="wordmark" href="/">144<span>-0</span></a><div className="nav-center"><button className={mode === 'classic' ? 'selected' : ''} onClick={() => restart('classic')}>CLASSIC</button><button className={mode === 'iq' ? 'selected' : ''} onClick={() => restart('iq')}>BASEBALL IQ</button></div><span className="status"><i /> KBO EDITION</span></nav>
    <section className="hero"><div><p className="kicker">THE ALL-TIME KBO ROSTER GAME</p><h1>BUILD A TEAM<br />THAT <em>NEVER</em> LOSES.</h1></div><aside><b>HOW IT WORKS</b><p>팀과 시즌을 돌리고, 그 시즌 로스터에서 한 명을 골라 라인업을 완성하세요.</p><div><span>16 SLOTS</span><span>3 FOREIGN MAX</span><span>144 GAMES</span></div></aside></section>
    {result && <section className="top-result"><span>PROJECTED SEASON</span><strong>{result.wins}-{result.losses}</strong><b>144-0 CHANCE {result.chance}%</b><button onClick={() => restart()}>다시 게임하기</button></section>}
    <section className="game">
      <section className="roster panel"><div className="panel-head"><div><p className="kicker">01 / YOUR CLUB</p><h2>FIELD <small>{selected.length}/16</small></h2>{result && <p className="lineup-wins">PROJECTED <b>{result.wins}W</b></p>}</div><div className="foreign">FOREIGN <b>{foreign}/3</b></div></div><div className="field"><div className="infield" />{fieldSlots.map(marker)}</div><div className="pitching"><p>ROTATION & BULLPEN</p><div className="pitch-list">{pitchSlots.map((slot) => { const player = roster[slot]; return <div className={`pitch-card ${player ? 'picked' : 'empty'}`} key={slot}><span>{slotLabels[slot]}</span><b>{player ? seasonName(player) : '빈 자리'}</b></div>; })}</div></div></section>
      <section className="draft panel"><div className="panel-head"><div><p className="kicker">02 / TEAM & SEASON ROULETTE</p><h2>{offer ? `${offer.context.season} ${offer.context.team}` : 'SPIN FOR A ROSTER'}</h2></div><span className={`mode-chip ${mode}`}>{mode === 'classic' ? 'CLASSIC' : 'IQ MODE'}</span></div><div className="roulette"><div className="wheel" /><div className="roulette-inner"><p>{offer ? `${offer.context.season} ${offer.context.team}` : 'WHO IS NEXT?'}</p><strong>{offer ? 'SEASON ROSTER' : 'KBO TIME MACHINE'}</strong><button className="spin" disabled={loading || complete || Boolean(offer)} onClick={() => spin()}>{loading ? 'SPINNING...' : 'SPIN THE ROULETTE'}</button><button className="reroll" disabled={!offer || rerolls === 0 || loading} onClick={() => spin(true)}>REROLL <b>{rerolls}/2</b></button></div></div><div className="choices roster-choices">{offer ? <><section className="candidate-section"><p className="candidate-heading">타자 <span>{dhMode ? 'DESIGNATED HITTER' : 'POSITION PLAYERS'}</span>{!roster.DH && <button className="dh-select" onClick={() => setDhMode((value) => !value)}>{dhMode ? '포지션 선택으로 복귀' : '지명타자로 선택'}</button>}</p><div className="candidate-grid">{offer.candidates.filter((player) => player.type === 'hitter').map(renderCandidate)}</div></section>{!dhMode && <section className="candidate-section"><p className="candidate-heading">투수 <span>PITCHERS</span></p><div className="candidate-grid">{offer.candidates.filter((player) => player.type === 'pitcher').map(renderCandidate)}</div></section>}</> : <p>룰렛을 돌린 다음,<br />그 팀과 시즌의 로스터에서 한 명을 선택하세요.</p>}</div></section>
    </section>
    <section className="season-action"><div><p className="kicker">READY FOR THE SEASON?</p><b>{complete ? '라인업 완성. 이제 144경기를 시작할 수 있습니다.' : `남은 자리 ${16 - selected.length}개를 채워 주세요.`}</b></div><button disabled={!complete || loading} onClick={simulate}>{loading ? 'SIMULATING...' : '시즌 진행'}</button></section>
    {result && <section className="result"><div className="record"><p className="kicker">PROJECTED KBO SEASON</p><strong>{result.wins}-{result.losses}</strong><p>이 로스터가 144경기를 치렀을 때의 예상 성적입니다.</p><button className="restart-game" onClick={() => restart()}>다시 게임하기</button></div><div className="analysis"><div><p className="kicker">TEAM DNA</p><b className="chance">{result.chance}%</b><span>144-0 달성 확률</span>{result.summary.map((item) => <p className="summary" key={item}>{item}</p>)}</div><div className="score-list">{Object.entries(result.traits).map(([label, score]) => <div className="score-card" key={label}><span>{label}</span><b>{score}</b><small>/ 100점</small></div>)}</div></div></section>}
    <section className="model-leaderboard"><p className="kicker">MODEL HALL OF FAME</p><h2>역대 모델 상위 로스터</h2><div>{MODEL_LEADERBOARD.map(([team, wins], index) => <p key={team}><span>{index + 1}</span><b>{team}</b><strong>{wins}승</strong></p>)}</div></section>
    <footer className="site-version"><span>{SITE_VERSION}</span><span>LAST UPDATED {LAST_UPDATED}</span></footer>
  </main>;
}
