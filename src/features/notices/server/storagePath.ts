import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

function isReadOnlyFilesystemError(error: unknown) {
  const nodeError = error as NodeJS.ErrnoException;
  return nodeError?.code === "EROFS" || nodeError?.code === "EPERM" || nodeError?.code === "EACCES";
}

function getBundledDataDir() {
  return path.join(process.cwd(), "data");
}

function getWritableDataDir() {
  if (process.env.NOTICE_DATA_DIR) {
    return process.env.NOTICE_DATA_DIR;
  }

  return path.join(os.tmpdir(), "campus-notice-hub-data");
}

export function getStorageFileCandidates(fileName: string) {
  const writablePath = path.join(getWritableDataDir(), fileName);
  const bundledPath = path.join(getBundledDataDir(), fileName);

  return writablePath === bundledPath ? [writablePath] : [writablePath, bundledPath];
}

export async function readJsonFile<T>(fileName: string): Promise<T | null> {
  for (const filePath of getStorageFileCandidates(fileName)) {
    try {
      const file = await fs.readFile(filePath, "utf-8");
      return JSON.parse(file) as T;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === "ENOENT") {
        continue;
      }

      throw error;
    }
  }

  return null;
}

export async function writeJsonFile(fileName: string, value: unknown) {
  const writablePath = path.join(getWritableDataDir(), fileName);

  try {
    await fs.mkdir(path.dirname(writablePath), { recursive: true });
    await fs.writeFile(writablePath, JSON.stringify(value, null, 2), "utf-8");
    return writablePath;
  } catch (error) {
    if (!isReadOnlyFilesystemError(error)) {
      throw error;
    }
  }

  const bundledPath = path.join(getBundledDataDir(), fileName);
  await fs.mkdir(path.dirname(bundledPath), { recursive: true });
  await fs.writeFile(bundledPath, JSON.stringify(value, null, 2), "utf-8");
  return bundledPath;
}
