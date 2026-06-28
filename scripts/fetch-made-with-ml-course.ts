import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  MADE_WITH_ML_COURSE_PAGES,
  courseUrl,
  extractCourseMarkdown,
} from "./lib/madewithml-course";

const OUT_DIR = join(process.cwd(), "content", "external", "madewithml-course");

type ManifestEntry = {
  slug: string;
  title: string;
  url: string;
  path: string;
  chars: number;
};

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "yoona-academy-content-ingest/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const manifest: ManifestEntry[] = [];

  for (const page of MADE_WITH_ML_COURSE_PAGES) {
    const url = courseUrl(page.slug);
    const html = await fetchText(url);
    const markdown = extractCourseMarkdown(html, url);
    const path = `${page.slug}.md`;
    writeFileSync(join(OUT_DIR, path), markdown + "\n");
    manifest.push({
      slug: page.slug,
      title: page.title,
      url,
      path,
      chars: markdown.length,
    });
    console.log(`✓ ${page.slug} — ${markdown.length.toLocaleString()} chars`);
  }

  writeFileSync(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(
      {
        source: "Made With ML MLOps course",
        fetchedAt: new Date().toISOString(),
        pages: manifest,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`\nFetched ${manifest.length} Made With ML course pages → ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
