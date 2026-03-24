import "dotenv/config";
import { runNoticeCheck } from "../src/features/notices/server/runNoticeCheck";

runNoticeCheck().catch((error) => {
  console.error("notice check failed");
  console.error(error);
  process.exitCode = 1;
});
