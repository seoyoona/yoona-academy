import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { embedYouTubeLinks, promoteYouTubeEmbeds } from "./video-embeds";

/**
 * Markdown → HTML with GitHub-flavored markdown, raw HTML passthrough, heading
 * anchors, and Shiki dual-theme syntax highlighting. Runs in async Server
 * Components; lesson pages are statically rendered so this cost is paid once.
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypePrettyCode, {
    theme: { light: "github-light", dark: "github-dark" },
    keepBackground: false,
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

type RenderMarkdownOptions = {
  embedYouTubeLinks?: boolean;
  promoteYouTubeEmbeds?: boolean;
};

export async function renderMarkdown(
  md: string,
  options: RenderMarkdownOptions = {},
): Promise<string> {
  const embedded = options.embedYouTubeLinks === false ? md : embedYouTubeLinks(md);
  const promoted =
    options.promoteYouTubeEmbeds === false
      ? embedded
      : promoteYouTubeEmbeds(embedded, md);
  const file = await processor.process(promoted);
  return String(file);
}
