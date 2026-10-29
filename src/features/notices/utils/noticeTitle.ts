const SITE_SUFFIX_PATTERN = /\s*(?:[|｜]|[-–—])\s*(?:전남대학교|Chonnam National University).*$/i;
const LEADING_DECORATION_PATTERN = /^\s*[>›»]+\s*/;
const TRUNCATED_END_PATTERN = /(?:\.{3,}|…+)\s*[\]})」』”’"']*$/;

const GENERIC_TITLES = new Set([
  "전남대학교",
  "전남대학교 홈페이지",
  "전남대학교 광주 생활관",
  "전남대학교 여수 생활관",
  "chonnam national university",
]);

export function normalizeNoticeTitle(value?: string | null) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(LEADING_DECORATION_PATTERN, "")
    .replace(SITE_SUFFIX_PATTERN, "")
    .trim();
}

export function isLikelyTruncatedTitle(value?: string | null) {
  return TRUNCATED_END_PATTERN.test(normalizeNoticeTitle(value));
}

function isGenericTitle(value: string, sourceName?: string) {
  const normalized = value.toLowerCase();
  if (GENERIC_TITLES.has(normalized)) return true;
  const normalizedSource = normalizeNoticeTitle(sourceName).toLowerCase();
  return !!normalizedSource && normalized === normalizedSource;
}

export function selectBestNoticeTitle(
  original: string,
  candidates: Array<string | null | undefined>,
  sourceName?: string,
) {
  const normalizedOriginal = normalizeNoticeTitle(original) || original.trim();
  const unique = [...new Set([normalizedOriginal, ...candidates.map(normalizeNoticeTitle)].filter(Boolean))];
  const usable = unique.filter((candidate) => !isGenericTitle(candidate, sourceName));
  const pool = usable.length > 0 ? usable : [normalizedOriginal];

  return pool.sort((left, right) => {
    const completeness = Number(!isLikelyTruncatedTitle(right)) - Number(!isLikelyTruncatedTitle(left));
    return completeness || right.length - left.length;
  })[0] ?? normalizedOriginal;
}
