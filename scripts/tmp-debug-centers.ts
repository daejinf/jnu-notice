import { enabledCenterBoardConfigs } from "../src/features/notices/config/centerBoards";
import { fetchCenterBoardNotices } from "../src/features/notices/lib/fetchCenterBoardNotices";

const centers = ["grow-maru", "ile", "lec", "library", "international", "dormitory", "sw-core", "sw-core-education", "aicoss", "nccoss"];

async function main() {
  for (const key of centers) {
    const center = enabledCenterBoardConfigs.find((item) => item.key === key);
    if (!center) continue;
    const start = Date.now();
    try {
      const notices = await fetchCenterBoardNotices(center, { maxPages: 10 });
      console.log(JSON.stringify({ key, ok: true, ms: Date.now() - start, count: notices.length }));
    } catch (error) {
      console.log(JSON.stringify({ key, ok: false, ms: Date.now() - start, error: error instanceof Error ? error.message : String(error) }));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
