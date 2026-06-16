import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Clone-or-pull the upstream learning repos into content/sources/ so a content
 * refresh is one command: `pnpm refresh` = fetch → ingest → enrich.
 */
const SOURCES = join(process.cwd(), "content", "sources");

const REPOS: Array<{ dir: string; url: string }> = [
  { dir: "thirty-days-python", url: "https://github.com/asabeneh/30-Days-Of-Python.git" },
  { dir: "made-with-ml", url: "https://github.com/GokuMohandas/Made-With-ML.git" },
  { dir: "cs229", url: "https://github.com/afshinea/stanford-cs-229-machine-learning.git" },
  { dir: "project-based-learning", url: "https://github.com/practical-tutorials/project-based-learning.git" },
  { dir: "awesome-ml", url: "https://github.com/josephmisiti/awesome-machine-learning.git" },
];

function run(args: string[], cwd?: string) {
  execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
}

function main() {
  mkdirSync(SOURCES, { recursive: true });
  for (const { dir, url } of REPOS) {
    const path = join(SOURCES, dir);
    try {
      if (existsSync(join(path, ".git"))) {
        run(["pull", "--depth", "1", "--ff-only"], path);
        console.log(`↻ pulled ${dir}`);
      } else {
        run(["clone", "--depth", "1", "-q", url, path]);
        console.log(`✓ cloned ${dir}`);
      }
    } catch (err) {
      console.error(`✗ ${dir}: ${(err as Error).message}`);
    }
  }
  console.log("\nSources up to date → run `pnpm ingest` then `pnpm enrich`.");
}

main();
