export type Slot = 'C' | '1B' | '2B' | 'SS' | '3B' | 'LF' | 'CF' | 'RF' | 'DH' | 'SP1' | 'SP2' | 'SP3' | 'SP4' | 'RP1' | 'RP2' | 'RP3';
export type Player = { id: string; name: string; slot: Slot; team: string; season: number; foreign: boolean; type: 'hitter' | 'pitcher'; line: string; score: number };
export const slotOrder: Slot[] = ['C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH', 'SP1', 'SP2', 'SP3', 'SP4', 'RP1', 'RP2', 'RP3'];

type RosterSeed = { team: string; season: number; foreignSlots: Slot[]; names: Record<Slot, string>; scores: number[] };

// Each team-season has a fixed roster: the name and the position never change by roulette spin.
const rosters: RosterSeed[] = [
  { team: '서울 레인저스', season: 2002, foreignSlots: ['SP2'], scores: [85,90,84,88,86,87,91,86,89,92,95,87,84,86,88,90], names: { C:'강도윤','1B':'백태진','2B':'신우성',SS:'문재호','3B':'윤현석',LF:'차민규',CF:'한이준',RF:'서도현',DH:'김태현',SP1:'류건우',SP2:'마크윤',SP3:'장시후',SP4:'오태경',RP1:'노진우',RP2:'최강민',RP3:'배도훈' } },
  { team: '부산 블루웨이브', season: 2005, foreignSlots: ['1B','SP1'], scores: [86,94,87,91,88,85,92,88,91,96,93,89,86,87,91,90], names: { C:'박준서','1B':'로건김','2B':'김시온',SS:'오재민','3B':'유승호',LF:'정도겸',CF:'이도겸',RF:'송하준',DH:'문태영',SP1:'데이비드박',SP2:'윤석진',SP3:'안도윤',SP4:'권시훈',RP1:'서준혁',RP2:'임성호',RP3:'구민재' } },
  { team: '대구 드래곤즈', season: 2008, foreignSlots: ['RF'], scores: [88,89,90,93,87,91,90,95,92,94,89,91,88,93,87,89], names: { C:'서민호','1B':'도현우','2B':'유강민',SS:'황재훈','3B':'강민석',LF:'천도윤',CF:'박지환',RF:'케빈최',DH:'이준형',SP1:'문현우',SP2:'김태윤',SP3:'안재민',SP4:'조성호',RP1:'송재현',RP2:'차우진',RP3:'최시온' } },
  { team: '인천 스카이문', season: 2011, foreignSlots: ['DH','SP3'], scores: [87,92,88,90,91,89,93,87,96,90,88,94,87,91,92,90], names: { C:'임도현','1B':'백준호','2B':'김하람',SS:'노승현','3B':'장유찬',LF:'신태오',CF:'윤도현',RF:'서준영',DH:'제이크문',SP1:'오민재',SP2:'한시우',SP3:'루크신',SP4:'정현석',RP1:'유민호',RP2:'권태윤',RP3:'박성진' } },
  { team: '광주 타이탄즈', season: 2014, foreignSlots: ['CF'], scores: [90,94,91,89,93,88,97,94,90,95,91,90,93,89,92,94], names: { C:'차성윤','1B':'이준호','2B':'박현우',SS:'김도겸','3B':'송재윤',LF:'한민재',CF:'브랜든강',RF:'문시후',DH:'정도윤',SP1:'장우진',SP2:'서재현',SP3:'노태현',SP4:'윤진호',RP1:'배시환',RP2:'오준석',RP3:'최도윤' } },
  { team: '대전 이글스', season: 2016, foreignSlots: ['SP1','RP2'], scores: [85,89,91,88,90,93,91,89,92,97,91,88,90,92,95,89], names: { C:'권민석','1B':'서하진','2B':'김윤호',SS:'조도현','3B':'장민규',LF:'오시우',CF:'한재민',RF:'신도윤',DH:'문태석',SP1:'에반류',SP2:'박성윤',SP3:'이현우',SP4:'최재훈',RP1:'백진호',RP2:'카일문',RP3:'윤태민' } },
  { team: '수원 메테오스', season: 2018, foreignSlots: ['SP2'], scores: [87,88,90,86,91,89,93,90,88,94,96,89,91,92,90,93], names: { C:'박성민','1B':'최민준','2B':'정승호',SS:'강현우','3B':'윤태양',LF:'한준서',CF:'신예준',RF:'장민석',DH:'문성민',SP1:'서민준',SP2:'알렉스리',SP3:'오현우',SP4:'임태양',RP1:'송준서',RP2:'김예준',RP3:'이민석' } },
  { team: '창원 다이노스', season: 2020, foreignSlots: ['1B','SP4'], scores: [91,96,92,94,90,93,95,92,97,93,91,94,96,88,90,95], names: { C:'김도윤','1B':'매튜한','2B':'류현민',SS:'박시환','3B':'오지훈',LF:'문건우',CF:'서진혁',RF:'장도현',DH:'최승민',SP1:'한태준',SP2:'윤서진',SP3:'노준영',SP4:'제이박',RP1:'강지후',RP2:'이태성',RP3:'신현우' } },
  { team: '잠실 베어스', season: 2022, foreignSlots: ['LF'], scores: [92,93,89,95,94,98,91,93,96,95,92,94,90,91,94,92], names: { C:'윤성호','1B':'차준혁','2B':'문도윤',SS:'김태민','3B':'이승현',LF:'제임스오',CF:'박주원',RF:'서재민',DH:'한도윤',SP1:'오성민',SP2:'정우진',SP3:'류태경',SP4:'백현석',RP1:'송도현',RP2:'임시우',RP3:'장윤호' } },
  { team: '고양 히어로즈', season: 2024, foreignSlots: ['DH','SP1'], scores: [89,95,93,92,96,90,94,91,98,98,94,92,95,93,96,94], names: { C:'한성민','1B':'신도겸','2B':'최준혁',SS:'오태윤','3B':'김시후',LF:'박우진',CF:'윤재호',RF:'문현석',DH:'라이언김',SP1:'앤디서',SP2:'장성우',SP3:'노민재',SP4:'이태훈',RP1:'서건우',RP2:'강재민',RP3:'백도윤' } },
];

function statLine(slot: Slot, score: number, order: number) {
  if (slot.startsWith('SP') || slot.startsWith('RP')) {
    const era = (4.2 - (score - 78) * 0.09).toFixed(2);
    return `평균자책 ${era} / 승 ${6 + (order % 14)} / 세이브 ${slot.startsWith('RP') ? 10 + (order % 27) : 0}`;
  }
  return `타율 .${260 + (score - 78) * 2} / 홈런 ${8 + (order % 23)} / OPS .${720 + (score - 78) * 8}`;
}

export const seasonRosters = rosters.map((roster, rosterIndex) => ({
  context: { team: roster.team, season: roster.season },
  candidates: slotOrder.map((slot, index) => ({
    id: `${roster.season}-${slot}`,
    name: roster.names[slot], slot, team: roster.team, season: roster.season,
    foreign: roster.foreignSlots.includes(slot), type: slot.startsWith('SP') || slot.startsWith('RP') ? 'pitcher' : 'hitter',
    line: statLine(slot, roster.scores[index], rosterIndex * 16 + index), score: roster.scores[index],
  })),
}));
