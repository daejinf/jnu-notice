import {
  ACCOUNT_FIRST_SEEN_DATE_STORAGE_KEY,
  BOOKMARK_NOTICE_STORAGE_KEY,
  CENTER_STORAGE_KEY,
  COLLEGE_STORAGE_KEY,
  DEPARTMENT_STORAGE_KEY,
  READ_NOTICE_STORAGE_KEY,
  SCHOOL_STORAGE_KEY,
  buildScopedStorageKey,
} from "@/features/notices/constants/storageKeys";

export const GUEST_STORAGE_SCOPE = "guest";

const ARRAY_KEYS = [
  SCHOOL_STORAGE_KEY,
  COLLEGE_STORAGE_KEY,
  DEPARTMENT_STORAGE_KEY,
  CENTER_STORAGE_KEY,
  READ_NOTICE_STORAGE_KEY,
  BOOKMARK_NOTICE_STORAGE_KEY,
] as const;

export function readStoredArray(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function mergeGuestStateIntoAccount(accountScope: string) {
  const markerKey = `notice-guest-merged::${accountScope.trim().toLowerCase()}`;
  if (window.localStorage.getItem(markerKey) === "1") return false;

  ARRAY_KEYS.forEach((baseKey) => {
    const guestKey = buildScopedStorageKey(baseKey, GUEST_STORAGE_SCOPE);
    const accountKey = buildScopedStorageKey(baseKey, accountScope);
    const merged = Array.from(new Set([...readStoredArray(accountKey), ...readStoredArray(guestKey)]));
    window.localStorage.setItem(accountKey, JSON.stringify(merged));
  });

  const guestFirstSeen = window.localStorage.getItem(buildScopedStorageKey(ACCOUNT_FIRST_SEEN_DATE_STORAGE_KEY, GUEST_STORAGE_SCOPE));
  const accountFirstSeenKey = buildScopedStorageKey(ACCOUNT_FIRST_SEEN_DATE_STORAGE_KEY, accountScope);
  const accountFirstSeen = window.localStorage.getItem(accountFirstSeenKey);
  const earliest = [guestFirstSeen, accountFirstSeen].filter(Boolean).sort()[0];
  if (earliest) window.localStorage.setItem(accountFirstSeenKey, earliest);

  window.localStorage.setItem(markerKey, "1");
  return true;
}
