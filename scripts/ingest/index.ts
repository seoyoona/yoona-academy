import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TrackSchema, ResourceSchema } from "../../src/content/types";
import { buildPythonTrack } from "./thirty-days-python";
import { buildMlTrack } from "./made-with-ml";
import { buildResources } from "./resources";

const ROOT = process.cwd();
const SOURCES = join(ROOT, "content", "sources");
const GEN = join(ROOT, "content", "generated");
const TRACKS = join(GEN, "tracks");

function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function main() {
  mkdirSync(TRACKS, { recursive: true });

  const tracks = [buildPythonTrack(SOURCES), buildMlTrack(SOURCES)].map((t) =>
    TrackSchema.parse(t),
  );
  for (const track of tracks) {
    writeJson(join(TRACKS, `${track.slug}.json`), track);
    const lessons = track.modules.reduce((n, m) => n + m.lessons.length, 0);
    console.log(
      `✓ track "${track.title}" — ${track.modules.length} modules, ${lessons} lessons`,
    );
  }

  const resources = buildResources(SOURCES).map((r) => ResourceSchema.parse(r));
  writeJson(join(GEN, "resources.json"), resources);
  console.log(`✓ resources — ${resources.length} entries`);

  console.log("\nIngest complete → content/generated/");
}

main();
