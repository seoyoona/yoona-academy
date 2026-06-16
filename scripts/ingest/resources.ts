import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Resource } from "../../src/content/types";
import { splitByHeading, parseLinkBullets, slugify } from "../lib/markdown";

const SKIP = /important|star history|table of contents|contributing|license|credits|^index$|^tools$/i;

function fromIndexRepo(opts: {
  sourcesDir: string;
  repo: string;
  sourceRepo: string;
  group: string;
  perCategoryCap: number;
}): Resource[] {
  const file = join(opts.sourcesDir, opts.repo, "README.md");
  if (!existsSync(file)) return [];
  const md = readFileSync(file, "utf8");
  const out: Resource[] = [];
  let n = 0;

  for (const section of splitByHeading(md, 2)) {
    const category = section.title.replace(/[:：]\s*$/, "").trim();
    if (SKIP.test(category) || !category) continue;
    const links = parseLinkBullets(section.body).slice(0, opts.perCategoryCap);
    for (const link of links) {
      out.push({
        id: `${opts.repo}-${slugify(category)}-${n++}`,
        title: link.title,
        url: link.url,
        category: `${opts.group} · ${category}`,
        tags: [opts.group, category],
        sourceRepo: opts.sourceRepo,
        description: link.description,
      });
    }
  }
  return out;
}

const CS229: Resource[] = [
  ["super-cheatsheet-machine-learning.pdf", "머신러닝 종합 치트시트"],
  ["cheatsheet-supervised-learning.pdf", "지도학습 치트시트"],
  ["cheatsheet-unsupervised-learning.pdf", "비지도학습 치트시트"],
  ["cheatsheet-deep-learning.pdf", "딥러닝 치트시트"],
  ["cheatsheet-machine-learning-tips-and-tricks.pdf", "ML 팁 & 트릭 치트시트"],
  ["refresher-probabilities-statistics.pdf", "확률·통계 리프레셔"],
  ["refresher-algebra-calculus.pdf", "선형대수·미적분 리프레셔"],
].map(([file, title], i) => ({
  id: `cs229-${i}`,
  title,
  url: `https://github.com/afshinea/stanford-cs-229-machine-learning/blob/master/en/${file}`,
  category: "레퍼런스 · Stanford CS229",
  tags: ["Reference", "Machine Learning", "CS229"],
  sourceRepo: "afshinea/stanford-cs-229-machine-learning",
  description: "Stanford CS229 머신러닝 공식 치트시트 (PDF)",
}));

export function buildResources(sourcesDir: string): Resource[] {
  return [
    ...fromIndexRepo({
      sourcesDir,
      repo: "project-based-learning",
      sourceRepo: "practical-tutorials/project-based-learning",
      group: "프로젝트 기반 학습",
      perCategoryCap: 60,
    }),
    ...fromIndexRepo({
      sourcesDir,
      repo: "awesome-ml",
      sourceRepo: "josephmisiti/awesome-machine-learning",
      group: "ML 라이브러리",
      perCategoryCap: 40,
    }),
    ...CS229,
  ];
}
