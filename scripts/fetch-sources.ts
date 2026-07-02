import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Clone-or-pull the upstream learning repos into content/sources/ so a content
 * refresh is one command: `pnpm refresh` = fetch → ingest → check → enrich.
 *
 * Large repos (e.g. mdn/content) may declare a `sparse` list of directory
 * prefixes — those are cloned with `--filter=blob:none --sparse` and expanded
 * via `git sparse-checkout set --cone <dirs>` so only the needed subtree lands
 * on disk (keeps a multi-GB repo down to a few MB).
 */
const SOURCES = join(process.cwd(), "content", "sources");

const REPOS: Array<{ dir: string; url: string; sparse?: string[] }> = [
  { dir: "thirty-days-python", url: "https://github.com/asabeneh/30-Days-Of-Python.git" },
  { dir: "made-with-ml", url: "https://github.com/GokuMohandas/Made-With-ML.git" },
  { dir: "cs229", url: "https://github.com/afshinea/stanford-cs-229-machine-learning.git" },
  { dir: "project-based-learning", url: "https://github.com/practical-tutorials/project-based-learning.git" },
  { dir: "awesome-ml", url: "https://github.com/josephmisiti/awesome-machine-learning.git" },
  { dir: "ai-engineering-from-scratch", url: "https://github.com/rohitg00/ai-engineering-from-scratch.git" },
  // AI Consultant course — MDN structured "Learn Web Development" (CC-BY-SA 2.5).
  // Only the learn_web_development subtree is needed → sparse checkout.
  {
    dir: "mdn-content",
    url: "https://github.com/mdn/content.git",
    sparse: ["files/en-us/learn_web_development"],
  },
];

function run(args: string[], cwd?: string) {
  execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
}

function cloneSparse(url: string, path: string, dirs: string[]) {
  // Partial + sparse clone: only root + the requested subtrees land on disk.
  run(["clone", "--depth", "1", "--filter=blob:none", "--sparse", "-q", url, path]);
  run(["sparse-checkout", "init", "--cone"], path);
  run(["sparse-checkout", "set", ...dirs], path);
}

function main() {
  mkdirSync(SOURCES, { recursive: true });
  for (const { dir, url, sparse } of REPOS) {
    const path = join(SOURCES, dir);
    try {
      if (existsSync(join(path, ".git"))) {
        if (sparse) {
          // Re-assert the sparse set in case it drifted, then pull.
          run(["sparse-checkout", "set", ...sparse], path);
          run(["pull", "--depth", "1", "--ff-only"], path);
        } else {
          run(["pull", "--depth", "1", "--ff-only"], path);
        }
        console.log(`↻ pulled ${dir}`);
      } else if (sparse) {
        cloneSparse(url, path, sparse);
        console.log(`✓ cloned ${dir} (sparse: ${sparse.join(", ")})`);
      } else {
        run(["clone", "--depth", "1", "-q", url, path]);
        console.log(`✓ cloned ${dir}`);
      }
    } catch (err) {
      console.error(`✗ ${dir}: ${(err as Error).message}`);
    }
  }
  console.log("\nSources up to date → run `pnpm ingest` then `pnpm check` then `pnpm enrich`.");
}

main();
