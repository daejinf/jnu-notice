export const SCHOOL_STORAGE_KEY = "selected-school-categories";
export const COLLEGE_STORAGE_KEY = "selected-college-boards";
export const DEPARTMENT_STORAGE_KEY = "selected-department-boards";
export const CENTER_STORAGE_KEY = "selected-center-boards";
export const READ_NOTICE_STORAGE_KEY = "read-notice-ids";
export const BOOKMARK_NOTICE_STORAGE_KEY = "bookmark-notice-ids";
export const ACCOUNT_FIRST_SEEN_DATE_STORAGE_KEY = "account-first-seen-date";

export function buildScopedStorageKey(baseKey: string, scope?: string) {
  const normalizedScope = scope?.trim().toLowerCase();

  if (!normalizedScope) {
    return baseKey;
  }

  return `${baseKey}::${normalizedScope}`;
}