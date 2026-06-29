export function embedYouTubeLinks(markdown: string): string {
  return splitFencedBlocks(markdown)
    .map((part) => (part.fenced ? part.text : embedYouTubeLinksInProse(part.text)))
    .join("");
}

type FencePart = { fenced: boolean; text: string };
export type YouTubeEmbed = { src: string; title: string; originalUrl: string };

const IFRAME_STYLE =
  "position:absolute;inset:0;width:100%;height:100%;border:0";
const WRAPPER_STYLE =
  "position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:1.25rem 0;background:#000";

function splitFencedBlocks(markdown: string): FencePart[] {
  const parts: FencePart[] = [];
  let cursor = 0;
  const fencePattern = /```[\s\S]*?```/g;
  for (const match of markdown.matchAll(fencePattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ fenced: false, text: markdown.slice(cursor, index) });
    parts.push({ fenced: true, text: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < markdown.length) parts.push({ fenced: false, text: markdown.slice(cursor) });
  return parts;
}

function embedYouTubeLinksInProse(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => embedYouTubeLinksInLine(line))
    .join("\n");
}

function embedYouTubeLinksInLine(line: string): string {
  const standalone = embedStandaloneYouTubeLine(line);
  if (standalone !== line) return standalone;
  return appendInlineYouTubeEmbeds(line);
}

function embedStandaloneYouTubeLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return line;

  const markdownLink = trimmed.match(
    /^(?:[-*]\s+)?\[([^\]]+)]\((https?:\/\/[^)]+)\)(?:\s*(?:--|[-–—:])\s*(.+))?$/,
  );
  const title = markdownLink?.[1];
  const url = markdownLink?.[2] ?? trimmed;
  const description = markdownLink?.[3];
  if (!/^https?:\/\/\S+$/.test(url)) return line;

  const embed = getYouTubeEmbed(url, title);
  if (!embed) return line;

  return renderYouTubeEmbed(embed, title, description);
}

function appendInlineYouTubeEmbeds(line: string): string {
  if (!line.trim() || line.includes("video-embed") || line.includes("<iframe")) return line;

  const embeds = extractInlineYouTubeEmbeds(line);
  if (!embeds.length) return line;

  return [
    line,
    "",
    ...embeds.flatMap((embed) => [renderYouTubeEmbed(embed), ""]),
  ].join("\n").trimEnd();
}

function extractInlineYouTubeEmbeds(line: string): YouTubeEmbed[] {
  const embeds = new Map<string, YouTubeEmbed>();
  const addEmbed = (url: string, title?: string) => {
    const embed = getYouTubeEmbed(stripTrailingPunctuation(url), title);
    if (embed && !embeds.has(embed.src)) embeds.set(embed.src, embed);
  };

  const markdownLinkPattern = /\[([^\]]+)]\((https?:\/\/[^)\s]+)\)/g;
  for (const match of line.matchAll(markdownLinkPattern)) {
    addEmbed(match[2], match[1]);
  }

  const rawUrlPattern =
    /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/[^\s)\]]+/g;
  for (const match of line.matchAll(rawUrlPattern)) {
    addEmbed(match[0]);
  }

  return Array.from(embeds.values());
}

function renderYouTubeEmbed(
  embed: YouTubeEmbed,
  title?: string,
  description?: string,
): string {
  return [
    `<div class="video-embed" style="${WRAPPER_STYLE}">`,
    `  <iframe style="${IFRAME_STYLE}" src="${embed.src}" title="${escapeAttr(embed.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`,
    `</div>`,
    "",
    title || description
      ? `<p><strong>${escapeHtml(title ?? embed.title)}</strong>${description ? ` — ${escapeHtml(description)}` : ""}</p>`
      : "",
    `[YouTube에서 바로 보기](${embed.originalUrl})`,
  ].filter(Boolean).join("\n");
}

export function getYouTubeEmbed(url: string, title?: string): YouTubeEmbed | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = cleanYouTubeId(parsed.pathname.slice(1));
    return id ? videoEmbed(id, url, title) : null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "music.youtube.com") {
    return null;
  }

  if (parsed.pathname === "/watch") {
    const id = cleanYouTubeId(parsed.searchParams.get("v") ?? "");
    return id ? videoEmbed(id, url, title) : null;
  }

  if (parsed.pathname.startsWith("/shorts/")) {
    const id = cleanYouTubeId(parsed.pathname.split("/")[2] ?? "");
    return id ? videoEmbed(id, url, title) : null;
  }

  if (parsed.pathname.startsWith("/embed/")) {
    const id = cleanYouTubeId(parsed.pathname.split("/")[2] ?? "");
    return id ? videoEmbed(id, url, title) : null;
  }

  if (parsed.pathname === "/playlist") {
    const list = cleanPlaylistId(parsed.searchParams.get("list") ?? "");
    return list
      ? {
          src: `https://www.youtube.com/embed/videoseries?list=${list}`,
          title: title ?? "YouTube playlist",
          originalUrl: url,
        }
      : null;
  }

  return null;
}

function videoEmbed(id: string, originalUrl: string, title?: string): YouTubeEmbed {
  return {
    src: `https://www.youtube.com/embed/${id}`,
    title: title ?? "YouTube video",
    originalUrl,
  };
}

function cleanYouTubeId(value: string): string {
  return value.match(/^[A-Za-z0-9_-]{6,}$/)?.[0] ?? "";
}

function cleanPlaylistId(value: string): string {
  return value.match(/^[A-Za-z0-9_-]{8,}$/)?.[0] ?? "";
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.,;:!?]+$/, "");
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
