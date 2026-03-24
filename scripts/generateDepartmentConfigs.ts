import { promises as fs } from "node:fs";
import path from "node:path";
import type { DepartmentNoticeCandidate } from "../src/features/notices/seeds/types";

function toKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/·/g, "-")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDepartmentConfigLine(candidate: DepartmentNoticeCandidate) {
  const key = toKey(`${candidate.college}-${candidate.department}`);

  return `  createDepartmentConfig(\n    "${key}",\n    "${candidate.college}",\n    "${candidate.department}",\n    "${candidate.siteUrl}",\n    "${candidate.noticeUrl}",\n    "${candidate.parserType}",\n  ),`;
}

async function main() {
  const inputPath = path.join(process.cwd(), "data", "departments.notice-candidates.json");
  const outputPath = path.join(process.cwd(), "data", "departments.generated.ts.txt");
  const file = await fs.readFile(inputPath, "utf-8");
  const candidates = JSON.parse(file) as DepartmentNoticeCandidate[];
  const lines = candidates.map(toDepartmentConfigLine);
  const content = [
    "// generated department config lines",
    ...lines,
    "",
  ].join("\n");

  await fs.writeFile(outputPath, content, "utf-8");
  console.log(`generated ${candidates.length} department config lines -> ${outputPath}`);
}

main().catch((error) => {
  console.error("generate department config failed");
  console.error(error);
  process.exitCode = 1;
});
