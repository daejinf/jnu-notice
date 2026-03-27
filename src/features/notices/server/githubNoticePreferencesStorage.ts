const DEFAULT_BRANCH = "main";
const FILE_PATH = "data/notice-preferences.json";

function getRepository() {
  return process.env.GITHUB_STORAGE_REPOSITORY ?? process.env.GITHUB_REPOSITORY ?? "";
}

function getBranch() {
  return process.env.GITHUB_STORAGE_BRANCH ?? process.env.VERCEL_GIT_COMMIT_REF ?? DEFAULT_BRANCH;
}

function getToken() {
  return process.env.GITHUB_STORAGE_TOKEN ?? "";
}

export function isGitHubJsonStorageEnabled() {
  return Boolean(getRepository() && getToken());
}

function getHeaders() {
  const token = getToken();

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "jnu-notice-hub",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

type GitHubContentResponse = {
  sha: string;
  content: string;
  encoding: string;
};

async function fetchGitHubFile() {
  const repository = getRepository();
  const branch = getBranch();
  const url = `https://api.github.com/repos/${repository}/contents/${FILE_PATH}?ref=${encodeURIComponent(branch)}`;
  const response = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub storage read failed (${response.status})`);
  }

  return (await response.json()) as GitHubContentResponse;
}

export async function loadGitHubNoticePreferencesMap<T>() {
  if (!isGitHubJsonStorageEnabled()) {
    return null;
  }

  const file = await fetchGitHubFile();
  if (!file) return null;

  const decoded = Buffer.from(file.content.replace(/\n/g, ""), file.encoding === "base64" ? "base64" : "utf-8").toString("utf-8");
  return JSON.parse(decoded) as T;
}

export async function saveGitHubNoticePreferencesMap(value: unknown) {
  if (!isGitHubJsonStorageEnabled()) {
    return false;
  }

  const repository = getRepository();
  const branch = getBranch();
  const existingFile = await fetchGitHubFile();
  const url = `https://api.github.com/repos/${repository}/contents/${FILE_PATH}`;
  const content = Buffer.from(JSON.stringify(value, null, 2), "utf-8").toString("base64");
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "chore: update notice preferences",
      content,
      branch,
      sha: existingFile?.sha,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub storage write failed (${response.status})`);
  }

  return true;
}
