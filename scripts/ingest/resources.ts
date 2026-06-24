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

/**
 * "7 AI Engineering Skills · 7 videos" — curated by Bashiri Smith
 * (instagram.com/reel/DYPnSM_B94c). Each links to the actual canonical video /
 * playlist (resolved from the reel's creator + topic), not a YouTube search.
 */
const AI_ENG_VIDEOS: Resource[] = [
  ["LangGraph 시리즈 (Python)", "https://www.youtube.com/playlist?list=PLAMHV77MSKJ7Pn_OwuGzbDPs_MOibBRP-", "LangGraph로 상태 그래프 기반 에이전트 직접 구현 (RAG→멀티에이전트 시리즈)"],
  ["Claude Code — The Net Ninja", "https://www.youtube.com/playlist?list=PL4cUxeGkcC9g4YJeBqChhFJwKQ9TRiivY", "Claude Code 실전 튜토리얼 플레이리스트 (The Net Ninja)"],
  ["Skills.md — 에이전트 말고 스킬을 만들어라", "https://www.youtube.com/watch?v=CEvIs9y1uog", "Don't Build Agents, Build Skills Instead — Barry Zhang & Mahesh Murag (Anthropic)"],
  ["Machine Learning with Python — sentdex", "https://www.youtube.com/playlist?list=PLQVvvaa0QuDfKTOs3Keq_kaG2P55YRn5v", "파이썬으로 머신러닝 기초 풀 플레이리스트 (sentdex)"],
  ["Agent Evaluation — Google Cloud", "https://www.youtube.com/watch?v=WZZLtwnZ4w0", "The agent evaluation revolution — 에이전트 평가 방법론 (Google Cloud)"],
  ["LLM Overview — Stanford CS224n", "https://www.youtube.com/playlist?list=PLoROMvodv4rOaMFbaqxPDoLWjDaRAdP9D", "Stanford CS224n NLP with Deep Learning — 사전학습/LLM 강의 (Lecture 9 포함)"],
  ["LLMOps — Databricks", "https://www.youtube.com/watch?v=1jvxxa7tdjw", "Exploring MLOps and LLMOps: Architectures and Best Practices (Databricks)"],
].map(([title, url, description], i) => ({
  id: `aieng-video-${i}`,
  title,
  url,
  category: "추천 영상 · AI 엔지니어 7대 스킬",
  tags: ["Video", "AI Engineering", "2026"],
  sourceRepo: "Bashiri Smith · instagram reel",
  description,
}));
AI_ENG_VIDEOS.push({
  id: "aieng-video-source",
  title: "7 AI Engineering Skills (출처 릴스)",
  url: "https://www.instagram.com/reel/DYPnSM_B94c/",
  category: "추천 영상 · AI 엔지니어 7대 스킬",
  tags: ["Video", "AI Engineering", "2026"],
  sourceRepo: "Bashiri Smith · instagram reel",
  description: "2026년 SWE가 AI 엔지니어가 되기 위한 7대 스킬 큐레이션 (원본 릴스)",
});

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
    ...AI_ENG_VIDEOS,
  ];
}
