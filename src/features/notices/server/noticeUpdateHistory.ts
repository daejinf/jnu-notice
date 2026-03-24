import { promises as fs } from "node:fs";
import path from "node:path";
import type { Notice, NoticeUpdateSnapshot } from "@/types/notice";

const HISTORY_FILE_PATH = path.join(process.cwd(), "data", "notice-updates.json");
const MAX_HISTORY_COUNT = 120;

async function ensureHistoryDirectory() {
  await fs.mkdir(path.dirname(HISTORY_FILE_PATH), { recursive: true });
}

export async function loadNoticeUpdateHistory(): Promise<NoticeUpdateSnapshot[]> {
  try {
    const file = await fs.readFile(HISTORY_FILE_PATH, "utf-8");
    return JSON.parse(file) as NoticeUpdateSnapshot[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function saveNoticeUpdateHistory(history: NoticeUpdateSnapshot[]) {
  await ensureHistoryDirectory();
  await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(history, null, 2), "utf-8");
}

export async function appendNoticeUpdateSnapshot(notices: Notice[]) {
  const history = await loadNoticeUpdateHistory();
  const nextHistory: NoticeUpdateSnapshot[] = [
    {
      checkedAt: new Date().toISOString(),
      notices,
    },
    ...history,
  ].slice(0, MAX_HISTORY_COUNT);

  await saveNoticeUpdateHistory(nextHistory);
}