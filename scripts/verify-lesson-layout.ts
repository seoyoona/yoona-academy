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

  assert(page.includes("const hasTranscripts ="), "expected lesson page to compute whether transcripts exist");
  assert(
    page.includes("embedYouTubeLinks: !hasTranscripts") &&
      page.includes("promoteYouTubeEmbeds: !hasTranscripts"),
    "expected lessons with transcript video cards not to also embed YouTube links inside the prose body",
  );
  assert(transcriptIndex !== -1, "expected lesson page to render TranscriptSection");
  assert(contentIndex !== -1, "expected lesson page to render lesson prose content");
  assert(
    transcriptIndex < contentIndex,
    "expected TranscriptSection to render before the long lesson body",
  );
  assert(
    page.includes("<iframe") && page.includes("<details"),
    "expected TranscriptSection to group each video iframe with its transcript details",
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
