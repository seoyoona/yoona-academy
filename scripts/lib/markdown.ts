/** Shared parsing helpers for the content adapters. */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type Section = { title: string; level: number; body: string };

/**
 * Split markdown into sections at headings of `level` (e.g. 2 → `## `). Each
 * section's body is everything from its heading up to the next heading of the
 * same-or-shallower level. Content before the first heading is dropped.
 */
export function splitByHeading(md: string, level: number): Section[] {
  const lines = md.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    const m = inFence ? null : line.match(/^(#{1,6})\s+(.*)$/);
    if (m && m[1].length <= level) {
      if (m[1].length === level) {
        if (current) sections.push(current);
        current = { title: m[2].trim(), level, body: "" };
        continue;
      }
      // a shallower heading closes the current section
      if (current) {
        sections.push(current);
        current = null;
      }
      continue;
    }
    if (current) current.body += line + "\n";
  }
  if (current) sections.push(current);
  return sections.map((s) => ({ ...s, body: s.body.trim() }));
}

/**
 * Extract every heading with its body (lines until the next heading of the
 * same-or-shallower level), preserving document order. Fence-aware.
 */
export function extractAllSections(md: string): Section[] {
  const lines = md.split("\n");
  const heads: Array<{ idx: number; level: number; title: string }> = [];
  let inFence = false;
  lines.forEach((line, idx) => {
    if (/^```/.test(line.trim())) inFence = !inFence;
    if (inFence) return;
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) heads.push({ idx, level: m[1].length, title: m[2].trim() });
  });

  return heads.map((h, i) => {
    let end = lines.length;
    for (let j = i + 1; j < heads.length; j++) {
      if (heads[j].level <= h.level) {
        end = heads[j].idx;
        break;
      }
    }
    return {
      title: h.title,
      level: h.level,
      body: lines.slice(h.idx + 1, end).join("\n").trim(),
    };
  });
}

/** Estimate reading/practice time from prose words + code lines. */
export function estimateMinutes(md: string): number {
  const words = md.split(/\s+/).filter(Boolean).length;
  const codeLines = (md.match(/\n/g) || []).length;
  const minutes = Math.round(words / 200 + codeLines / 30);
  return Math.max(3, Math.min(minutes, 45));
}

/**
 * Rewrite relative image/link URLs to absolute raw URLs so assets render.
 * `rawBase` must be the raw URL of the directory containing the file, ending
 * in `/`. Uses URL resolution so `../` segments collapse correctly.
 */
export function rewriteRelativeUrls(md: string, rawBase: string): string {
  const base = rawBase.endsWith("/") ? rawBase : rawBase + "/";
  const resolve = (path: string) => {
    try {
      return new URL(path, base).toString();
    } catch {
      return path;
    }
  };
  return md
    .replace(/(!?\[[^\]]*\]\()(?!https?:|#|mailto:)([^)\s]+)(\))/g,
      (_, pre, path, post) => `${pre}${resolve(path)}${post}`)
    .replace(/(<img[^>]+src=")(?!https?:)([^"]+)(")/g,
      (_, pre, path, post) => `${pre}${resolve(path)}${post}`);
}

/** Strip translation/footer cruft common to these READMEs. */
export function stripNav(md: string): string {
  return md
    .replace(/\[<<\s*Day[^\]]*\]\([^)]*\)/gi, "")
    .replace(/\[Day[^\]]*>>\s*\]\([^)]*\)/gi, "")
    .replace(/<div[^>]*>\s*<\/div>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type ParsedLink = { title: string; url: string; description?: string };

/** Parse `- [title](url) - description` / `* [..]` bullet lists. */
export function parseLinkBullets(body: string): ParsedLink[] {
  const out: ParsedLink[] = [];
  const re = /^[-*]\s*\[([^\]]+)\]\(([^)]+)\)\s*(?:[-–—:]\s*(.*))?$/;
  for (const raw of body.split("\n")) {
    const m = raw.trim().match(re);
    if (!m) continue;
    const url = m[2].trim();
    if (!/^https?:\/\//.test(url)) continue;
    out.push({
      title: m[1].trim(),
      url,
      description: m[3]?.trim() || undefined,
    });
  }
  return out;
}
