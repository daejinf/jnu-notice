import type { Notice } from "@/types/notice";

const GENERIC_WORDS = new Set([
  "공지", "안내", "알림", "전남대", "전남대학교", "관련", "대한", "위한",
  "2025", "2026", "2027", "학년도", "수정", "변경", "재안내",
]);

export type RelatedNotice = {
  notice: Notice;
  score: number;
  reason: string;
};

function tokenize(value: string) {
  return Array.from(new Set(
    value
      .toLowerCase()
      .replace(/\[[^\]]*\]|【[^】]*】|\([^)]*\)/g, " ")
      .replace(/[^0-9a-z가-힣]+/g, " ")
      .split(/\s+/)
      .map((word) => word.replace(/^(신규|추가|긴급)$/, ""))
      .filter((word) => word.length >= 2 && !/^\d+$/.test(word) && !GENERIC_WORDS.has(word)),
  ));
}

function parseDate(value: string) {
  const match = value.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  const time = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? null : time;
}

function scoreCandidate(source: Notice, sourceTokens: string[], sourceDate: number | null, candidate: Notice): RelatedNotice {
  const candidateTokens = tokenize(candidate.title);
  const candidateSet = new Set(candidateTokens);
  const shared = sourceTokens.filter((token) => candidateSet.has(token));
  const dice = sourceTokens.length + candidateTokens.length > 0
    ? (2 * shared.length) / (sourceTokens.length + candidateTokens.length)
    : 0;
  const sameCategory = source.category === candidate.category;
  const sameSource = source.sourceName === candidate.sourceName;
  const candidateDate = parseDate(candidate.date);
  const dayGap = sourceDate !== null && candidateDate !== null
    ? Math.abs(sourceDate - candidateDate) / (24 * 60 * 60 * 1000)
    : 365;
  const proximity = Math.max(0, 1 - dayGap / 120);
  const score = dice * 0.67 + (sameCategory ? 0.17 : 0) + (sameSource ? 0.1 : 0) + proximity * 0.06;

  const reason = shared.length > 0
    ? `${shared.slice(0, 2).join(" · ")} 키워드가 비슷해요`
    : sameCategory && sameSource
      ? `같은 ${source.category} · 같은 발행처예요`
      : sameCategory
        ? `같은 ${source.category} 공지예요`
        : `비슷한 시기에 올라온 ${candidate.category} 공지예요`;

  return { notice: candidate, score, reason };
}

export function findRelatedNotices(source: Notice, candidates: Notice[], limit = 4) {
  const sourceTokens = tokenize(source.title);
  const sourceDate = parseDate(source.date);
  const scored = candidates
    .filter((candidate) => candidate.url !== source.url && candidate.id !== source.id)
    .map((candidate) => scoreCandidate(source, sourceTokens, sourceDate, candidate))
    .filter((item) => item.score >= 0.16)
    .sort((left, right) => right.score - left.score);

  return scored.slice(0, limit);
}
