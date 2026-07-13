import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { Translation } from "../src/content/types";
import {
  generateLocalCliJson,
  isFatalLocalCliGenerationError,
  isRetryableLocalCliGenerationError,
  resolveLocalCliConfig,
  type LocalCliConfig,
} from "./lib/local-cli-json";

/**
 * Normalize markdown **bold** markers in the committed Korean translations
 * (content/generated/translations.json) using the local CLI model — the same
 * offline, no-API-cost path as translate.ts / enrich.ts.
 *
 * It ONLY repairs bold markers (e.g. the AI-style broken `** 텍스트 **` that
 * renders literally → `**텍스트**`). A strict fidelity guard rejects any output
 * whose text differs from the input once `**` and whitespace are ignored, so
 * words, code, math, and Python's `**` operator can never be altered.
 */

// Load local CLI settings from .env.local if present (Node 21+).
try {
  (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(
    ".env.local",
  );
} catch {
  /* no .env.local — rely on shell env */
}

const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");
/** Only touch lessons whose body looks like it has broken/spaced bold markers. */
const BROKEN_ONLY = process.argv.includes("--broken-only");
/** `--only=<substr>` restricts to lesson ids containing substr. */
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);
/** `--limit=<n>` caps how many lessons are processed this run (pilot mode). */
const LIMIT = Number(
  process.argv.find((a) => a.startsWith("--limit="))?.slice("--limit=".length) ?? "",
);

const GEN = join(process.cwd(), "content", "generated");
const TRANSLATIONS = join(GEN, "translations.json");
/** Sidecar cache: lessonId → fingerprint of the already-normalized body. */
const CACHE = join(GEN, "bold-normalized.json");

const SCHEMA = z.object({ contentMarkdown: z.string() });
type Generated = z.infer<typeof SCHEMA>;

type CacheEntry = { hash: string; model: string; generatedAt: string };

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback;
}

function hashOf(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/** Text with every `**` marker and all whitespace runs removed — the invariant. */
function boldAgnostic(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
}

/**
 * All code regions — fenced blocks (```…```) and inline code (`…`) — concatenated
 * verbatim. Bold repair must never enter code, so these must stay byte-identical;
 * this catches any `**`-operator or code reflow the text-level guard would miss.
 */
function codeSpans(text: string): string {
  const spans: string[] = [];
  const re = /```[\s\S]*?```|`[^`\n]*`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) spans.push(m[0]);
  return spans.join(" ");
}

/**
 * Cheap heuristic for `--broken-only`: a `**` marker that hugs an inner space
 * on one side only, i.e. `** 텍스트**` / `**텍스트 **` — the classic broken-bold
 * shape. Deliberately loose; the fidelity guard is what guarantees safety, this
 * just avoids spending the model on bodies that clearly have nothing to fix.
 */
function looksBroken(md: string): boolean {
  return /\*\* \S[^\n*]*\*\*|\*\*[^\n*]*\S \*\*/.test(md);
}

function readNormalizeConfig(): LocalCliConfig {
  return resolveLocalCliConfig(process.env, {
    providerEnvName: "NORMALIZE_PROVIDER",
    commandEnvNames: ["NORMALIZE_LOCAL_COMMAND", "LOCAL_AI_COMMAND"],
    modelEnvNames: ["NORMALIZE_LOCAL_MODEL", "LOCAL_AI_MODEL"],
    timeoutEnvNames: ["NORMALIZE_LOCAL_TIMEOUT_MS", "LOCAL_AI_TIMEOUT_MS"],
  });
}

async function normalizeBold(
  config: LocalCliConfig,
  content: string,
): Promise<Generated> {
  return generateLocalCliJson({
    command: config.command,
    schema: SCHEMA,
    timeoutMs: config.timeoutMs,
    prompt: [
      "당신은 마크다운 교정기입니다. 아래 본문에서 오직 굵게(**볼드**) 표기만 정리하세요.",
      "",
      "응답 형식:",
      "- 반드시 JSON 객체 하나만 출력하세요.",
      "- 코드펜스, 설명문, 주석을 붙이지 마세요.",
      "- 필드는 contentMarkdown 하나만 사용하세요.",
      "",
      "{",
      '  "contentMarkdown": "string"',
      "}",
      "",
      "고칠 것 (이것만):",
      "- AI가 잘못 만든 공백 포함 볼드를 렌더되는 형태로 붙인다: `** 텍스트 **` → `**텍스트**`, `**텍스트 **` → `**텍스트**`, `** 텍스트**` → `**텍스트**`.",
      "- 여는 `**` 바로 뒤, 닫는 `**` 바로 앞의 공백만 제거한다.",
      "",
      "절대 하지 말 것:",
      "- 단어·문장·숫자·기호를 추가/삭제/수정하지 말 것. 오직 `**` 마커 위치와 그 사이 공백만 조정한다.",
      "- 새로 볼드를 씌우거나 기존 볼드를 벗기지 말 것. 이미 있는 볼드의 형식만 고친다.",
      "- 코드펜스(```) 와 인라인 코드(`...`) 내부는 한 글자도 건드리지 말 것.",
      "- 파이썬 거듭제곱/언패킹 연산자(`x ** 2`, `a**b`, `**kwargs`)와 수식의 `**`는 볼드가 아니므로 절대 바꾸지 말 것.",
      "- 애매하면 원문 그대로 둔다.",
      "",
      "## 본문(마크다운)",
      content,
    ].join("\n"),
  });
}

async function normalizeWithRetry(
  config: LocalCliConfig,
  content: string,
  attempts = 3,
): Promise<Generated> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await normalizeBold(config, content);
    } catch (error) {
      lastError = error;
      if (!isRetryableLocalCliGenerationError(error) || attempt === attempts) break;
      console.warn(`  retrying after structured mismatch (${attempt}/${attempts})`);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function main() {
  const translations = readJson<Record<string, Translation>>(TRANSLATIONS, {});
  const cache = readJson<Record<string, CacheEntry>>(CACHE, {});

  const entries = Object.entries(translations)
    .filter(([, tr]) => typeof tr?.contentMarkdown === "string")
    .filter(([id]) => (ONLY ? id.includes(ONLY) : true))
    .filter(([, tr]) => (BROKEN_ONLY ? looksBroken(tr.contentMarkdown) : true));

  const todo = entries.filter(
    ([id, tr]) => FORCE || cache[id]?.hash !== hashOf(tr.contentMarkdown),
  );
  const limited = Number.isFinite(LIMIT) && LIMIT > 0 ? todo.slice(0, LIMIT) : todo;

  console.log(
    `${entries.length} candidate lessons · ${todo.length} to normalize` +
      `${limited.length !== todo.length ? ` · limited to ${limited.length}` : ""}` +
      `${BROKEN_ONLY ? " (broken-only)" : ""}\n`,
  );

  if (DRY_RUN) {
    for (const [id] of limited.slice(0, 30)) console.log(`- ${id}`);
    if (limited.length > 30) console.log(`...and ${limited.length - 30} more`);
    return;
  }
  if (limited.length === 0) return;

  let config: LocalCliConfig;
  try {
    config = readNormalizeConfig();
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
  }
  console.log(`model: ${config.provider}/${config.model}\n`);

  let changed = 0;
  let skipped = 0;
  let rejected = 0;
  for (const [id, tr] of limited) {
    try {
      const result = await normalizeWithRetry(config, tr.contentMarkdown);
      // Keep the source's exact trailing whitespace so a model that merely adds
      // a stray newline isn't miscounted as a real change.
      const trailing = tr.contentMarkdown.match(/\s*$/)?.[0] ?? "";
      const out = result.contentMarkdown.replace(/\s*$/, "") + trailing;

      // Fidelity guard: reject anything that altered more than bold markers,
      // or that touched a code region (fenced/inline) even by a space.
      if (boldAgnostic(out) !== boldAgnostic(tr.contentMarkdown)) {
        rejected += 1;
        console.warn(`⚠ ${id}: output changed non-bold text — kept original`);
        continue;
      }
      if (codeSpans(out) !== codeSpans(tr.contentMarkdown)) {
        rejected += 1;
        console.warn(`⚠ ${id}: output altered a code span — kept original`);
        continue;
      }

      if (out === tr.contentMarkdown) {
        skipped += 1; // already clean; record so we don't re-check next run
      } else {
        translations[id] = { ...tr, contentMarkdown: out };
        writeFileSync(TRANSLATIONS, JSON.stringify(translations, null, 2));
        changed += 1;
        console.log(`✓ ${id}`);
      }
      cache[id] = {
        hash: hashOf(out),
        model: `${config.provider}/${config.model}`,
        generatedAt: new Date().toISOString(),
      };
      writeFileSync(CACHE, JSON.stringify(cache, null, 2));
    } catch (err) {
      console.error(`✗ ${id}:`, (err as Error).message);
      if (isFatalLocalCliGenerationError(err)) {
        console.error("Fatal generation error; stopping.");
        break;
      }
    }
  }

  console.log(
    `\nDone — ${changed} normalized, ${skipped} already clean, ${rejected} rejected → ${TRANSLATIONS}`,
  );
}

main();
