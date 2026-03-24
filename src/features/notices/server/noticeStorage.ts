import { promises as fs } from "node:fs";
import path from "node:path";
import type { Notice } from "@/types/notice";

const STORAGE_FILE_PATH = path.join(process.cwd(), "data", "stored-notices.json");

async function ensureStorageDirectory() {
  await fs.mkdir(path.dirname(STORAGE_FILE_PATH), { recursive: true });
}

export async function loadStoredNotices(): Promise<Notice[]> {
  try {
    const file = await fs.readFile(STORAGE_FILE_PATH, "utf-8");
    return JSON.parse(file) as Notice[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function saveNotices(notices: Notice[]) {
  await ensureStorageDirectory();
  await fs.writeFile(STORAGE_FILE_PATH, JSON.stringify(notices, null, 2), "utf-8");
}

export function getStorageFilePath() {
  return STORAGE_FILE_PATH;
}
