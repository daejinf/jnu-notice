import type { MyAlertsSnapshot, MyAlertsSnapshotStore, Notice, NoticePreferences } from "@/types/notice";
import { buildMyAlertsSnapshotFromNotices } from "@/features/notices/server/myAlerts";
import { loadNoticePreferencesMap, normalizeNoticePreferenceScope } from "@/features/notices/server/noticePreferences";
import { readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";

const MY_ALERTS_SNAPSHOTS_FILE_NAME = "my-alerts-snapshots.json";

export async function loadMyAlertsSnapshotStore() {
  return await readJsonFile<MyAlertsSnapshotStore>(MY_ALERTS_SNAPSHOTS_FILE_NAME);
}

export async function loadMyAlertsSnapshot(scope: string): Promise<MyAlertsSnapshot | null> {
  const store = await loadMyAlertsSnapshotStore();
  if (!store) return null;

  const normalizedScope = normalizeNoticePreferenceScope(scope);
  return store.scopes[normalizedScope] ?? null;
}

export async function saveMyAlertsSnapshots(notices: Notice[], checkedAt: string) {
  const preferencesMap = await loadNoticePreferencesMap();
  const scopes = Object.fromEntries(
    Object.entries(preferencesMap).map(([scope, preferences]) => [
      normalizeNoticePreferenceScope(scope),
      buildMyAlertsSnapshotFromNotices(notices, checkedAt, preferences as NoticePreferences),
    ]),
  );

  const store: MyAlertsSnapshotStore = {
    checkedAt,
    scopes,
  };

  await writeJsonFile(MY_ALERTS_SNAPSHOTS_FILE_NAME, store);
  return store;
}
