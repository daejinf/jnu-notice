import type { NoticeState } from "@/types/notice";
import {
  loadGitHubNoticeStateMap,
  saveGitHubNoticeStateMap,
} from "@/features/notices/server/githubNoticeStateStorage";
import { readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";

const STATE_FILE_NAME = "notice-state.json";

type NoticeStateMap = Record<string, NoticeState>;

export function normalizeNoticeStateScope(scope: string) {
  return scope.trim().toLowerCase();
}

async function loadLocalNoticeStateMap() {
  return (await readJsonFile<NoticeStateMap>(STATE_FILE_NAME)) ?? {};
}

async function saveLocalNoticeStateMap(stateMap: NoticeStateMap) {
  await writeJsonFile(STATE_FILE_NAME, stateMap);
}

export async function loadNoticeStateMap() {
  return (await loadGitHubNoticeStateMap<NoticeStateMap>()) ?? (await loadLocalNoticeStateMap());
}

export async function loadNoticeState(scope: string) {
  const normalizedScope = normalizeNoticeStateScope(scope);
  const stateMap = await loadNoticeStateMap();
  return stateMap[normalizedScope] ?? null;
}

export async function saveNoticeState(scope: string, state: Omit<NoticeState, "updatedAt">) {
  const normalizedScope = normalizeNoticeStateScope(scope);
  const stateMap = await loadNoticeStateMap();
  const nextState: NoticeState = {
    readNoticeIds: Array.from(new Set(state.readNoticeIds)),
    bookmarkNoticeIds: Array.from(new Set(state.bookmarkNoticeIds)),
    updatedAt: new Date().toISOString(),
  };

  stateMap[normalizedScope] = nextState;
  await saveLocalNoticeStateMap(stateMap);
  await saveGitHubNoticeStateMap(stateMap).catch(() => false);
  return nextState;
}
