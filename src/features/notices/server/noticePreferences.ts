import type { NoticePreferences } from "@/types/notice";
import { readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";

const PREFERENCES_FILE_NAME = "notice-preferences.json";

type NoticePreferencesMap = Record<string, NoticePreferences>;

export function normalizeNoticePreferenceScope(scope: string) {
  return scope.trim().toLowerCase();
}

export async function loadNoticePreferencesMap() {
  return (await readJsonFile<NoticePreferencesMap>(PREFERENCES_FILE_NAME)) ?? {};
}

export async function loadNoticePreferences(scope: string) {
  const normalizedScope = normalizeNoticePreferenceScope(scope);
  const preferencesMap = await loadNoticePreferencesMap();
  return preferencesMap[normalizedScope] ?? null;
}

export async function saveNoticePreferences(scope: string, preferences: Omit<NoticePreferences, "updatedAt">) {
  const normalizedScope = normalizeNoticePreferenceScope(scope);
  const preferencesMap = await loadNoticePreferencesMap();
  const nextPreferences: NoticePreferences = {
    ...preferences,
    updatedAt: new Date().toISOString(),
  };

  preferencesMap[normalizedScope] = nextPreferences;
  await writeJsonFile(PREFERENCES_FILE_NAME, preferencesMap);
  return nextPreferences;
}
