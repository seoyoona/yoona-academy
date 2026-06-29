import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const page = readFileSync(
    join(process.cwd(), "src", "app", "learn", "[lessonId]", "page.tsx"),
    "utf8",
  );
  const transcriptIndex = page.indexOf("<TranscriptSection");
  const contentIndex = page.indexOf('className="lesson-prose');

  assert(transcriptIndex !== -1, "expected lesson page to render TranscriptSection");
  assert(contentIndex !== -1, "expected lesson page to render lesson prose content");
  assert(
    transcriptIndex < contentIndex,
    "expected TranscriptSection to render before the long lesson body",
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
