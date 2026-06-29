import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { parseVttTranscript, type LessonTranscripts } from "../src/lib/video-transcripts";

type LessonSource = {
  id: string;
  title: string;
  contentMarkdown: string;
};

type TrackFile = {
  modules: Array<{
    lessons: LessonSource[];
  }>;
};

type Translation = {
  title?: string;
  contentMarkdown?: string;
};

type YtdlpInfo = {
  id?: string;
  title?: string;
  webpage_url?: string;
  original_url?: string;
  language?: string;
};

const ROOT = process.cwd();
const GENERATED_DIR = join(ROOT, "content", "generated");
const TRACKS_DIR = join(GENERATED_DIR, "tracks");
const OUT_FILE = join(GENERATED_DIR, "video-transcripts.json");
const TMP_DIR = join(ROOT, ".tmp", "video-transcripts");
const DEFAULT_SUB_LANGS = "ko-en-GB,en-GB";
const LOCAL_TRANSLATOR = join(ROOT, ".venv-transcripts", "bin", "python");

function main() {
  const lessonId = readArg("--lesson");
  const useCache = process.argv.includes("--use-cache");
  if (!lessonId) {
    throw new Error("Usage: pnpm transcripts:video -- --lesson=<lesson-id>");
  }

  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error(`Could not find lesson: ${lessonId}`);

  const urls = extractYouTubeUrls(lesson.contentMarkdown);
  if (!urls.length) throw new Error(`Lesson has no YouTube URLs: ${lessonId}`);

  if (!useCache) {
    rmSync(TMP_DIR, { recursive: true, force: true });
    mkdirSync(TMP_DIR, { recursive: true });

    for (const url of urls) {
      downloadSubtitles(url);
    }
  } else if (!existsSync(TMP_DIR)) {
    throw new Error(`Transcript cache does not exist: ${TMP_DIR}`);
  }

  const videos = collectDownloadedVideos();
  if (!videos.length) {
    throw new Error(`No Korean transcript VTT files were downloaded for ${lessonId}`);
  }

  mkdirSync(GENERATED_DIR, { recursive: true });
  const current = readJson<Record<string, LessonTranscripts>>(OUT_FILE, {});
  current[lessonId] = {
    generatedAt: new Date().toISOString(),
    provider: "yt-dlp youtube auto-translated captions",
    videos: mergeVideos(current[lessonId]?.videos ?? [], videos),
  };
  writeFileSync(OUT_FILE, `${JSON.stringify(current, null, 2)}\n`);

  console.log(
    `Saved ${videos.length} transcript video(s) for ${lessonId} to ${OUT_FILE}`,
  );
}

function readArg(name: string): string | undefined {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function getLesson(lessonId: string): LessonSource | undefined {
  const translations = readJson<Record<string, Translation>>(
    join(GENERATED_DIR, "translations.json"),
    {},
  );

  for (const file of readdirSync(TRACKS_DIR).filter((name) => name.endsWith(".json"))) {
    const track = readJson<TrackFile | null>(join(TRACKS_DIR, file), null);
    if (!track) continue;

    for (const courseModule of track.modules) {
      for (const lesson of courseModule.lessons) {
        if (lesson.id !== lessonId) continue;
        const translation = translations[lessonId];
        return {
          ...lesson,
          title: translation?.title ?? lesson.title,
          contentMarkdown: translation?.contentMarkdown ?? lesson.contentMarkdown,
        };
      }
    }
  }

  return undefined;
}

function extractYouTubeUrls(markdown: string): string[] {
  const urls = new Set<string>();
  const pattern =
    /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/[^\s)\]<>"]+/g;
  for (const match of markdown.matchAll(pattern)) {
    urls.add(match[0].replace(/[.,;:!?]+$/, ""));
  }
  return Array.from(urls);
}

function downloadSubtitles(url: string): void {
  const args = [
    "--skip-download",
    "--write-auto-subs",
    "--write-subs",
    "--write-info-json",
    "--sub-langs",
    process.env.YOONA_TRANSCRIPT_SUB_LANGS ?? DEFAULT_SUB_LANGS,
    "--sub-format",
    "vtt",
    "--sleep-requests",
    process.env.YOONA_TRANSCRIPT_SLEEP ?? "2",
    "--ignore-errors",
    "-o",
    join(TMP_DIR, "%(playlist_index)s-%(id)s.%(ext)s"),
    url,
  ];
  execFileSync("yt-dlp", args, { stdio: "inherit" });
}

function collectDownloadedVideos(): LessonTranscripts["videos"] {
  const files = readdirSync(TMP_DIR);
  const infoById = new Map<string, YtdlpInfo>();

  for (const file of files.filter((name) => name.endsWith(".info.json"))) {
    const info = readJson<YtdlpInfo | null>(join(TMP_DIR, file), null);
    if (info?.id) infoById.set(info.id, info);
  }

  const videos = files
    .filter((name) => name.endsWith(".vtt"))
    .sort()
    .map((file) => {
      const parsed = parseSubtitleFilename(file);
      const info = parsed.videoId ? infoById.get(parsed.videoId) : undefined;
      const vtt = readFileSync(join(TMP_DIR, file), "utf8");
      const sourceSegments = parseVttTranscript(vtt);
      const isEnglish = parsed.language.startsWith("en");
      const segments = isEnglish ? translateSegments(sourceSegments) : sourceSegments;
      if (!parsed.videoId || !segments.length) return null;
      const video: LessonTranscripts["videos"][number] = {
        videoId: parsed.videoId,
        title: info?.title ?? parsed.videoId,
        url: info?.webpage_url ?? info?.original_url ?? `https://www.youtube.com/watch?v=${parsed.videoId}`,
        language: isEnglish ? `ko-local-${parsed.language}` : parsed.language,
        source: isEnglish
          ? "English YouTube captions translated locally with Argos Translate"
          : "YouTube auto-translated captions",
        segments,
      };
      if (parsed.order != null) video.order = parsed.order;
      return video;
    })
    .filter((video): video is LessonTranscripts["videos"][number] => Boolean(video));
  return mergeVideos([], videos);
}

function parseSubtitleFilename(file: string): { videoId?: string; language: string; order?: number } {
  const match = file.match(
    /^(?:(\d+|NA)-)?([A-Za-z0-9_-]{11})\.([^.]+)\.vtt$/,
  );
  return {
    videoId: match?.[2],
    language: match?.[3] ?? "ko",
    order: match?.[1] && match[1] !== "NA"
      ? Number(match[1])
      : undefined,
  };
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function mergeVideos(
  existing: LessonTranscripts["videos"],
  incoming: LessonTranscripts["videos"],
): LessonTranscripts["videos"] {
  const merged = new Map<string, LessonTranscripts["videos"][number]>();

  for (const video of [...existing, ...incoming]) {
    const previous = merged.get(video.videoId);
    if (!previous || isPreferredTranscript(video, previous)) {
      merged.set(video.videoId, video);
    } else if (previous.order == null && video.order != null) {
      merged.set(video.videoId, { ...previous, order: video.order });
    }
  }

  return Array.from(merged.values()).sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order;
    if (a.order != null) return -1;
    if (b.order != null) return 1;
    return a.title.localeCompare(b.title, "en", { numeric: true });
  });
}

function isPreferredTranscript(
  candidate: LessonTranscripts["videos"][number],
  current: LessonTranscripts["videos"][number],
): boolean {
  const languageRank = (language: string) => {
    if (language.startsWith("ko-en")) return 0;
    if (language.startsWith("ko-local-")) return 1;
    if (language === "ko") return 2;
    if (language.startsWith("ko-")) return 2;
    return 3;
  };
  const rankDiff = languageRank(candidate.language) - languageRank(current.language);
  if (rankDiff !== 0) return rankDiff < 0;
  if (candidate.order != null && current.order == null) return true;
  return candidate.segments.length > current.segments.length;
}

function translateSegments(
  segments: LessonTranscripts["videos"][number]["segments"],
): LessonTranscripts["videos"][number]["segments"] {
  if (!existsSync(LOCAL_TRANSLATOR)) {
    throw new Error(
      "English subtitles were downloaded, but .venv-transcripts is missing. Run `uv venv .venv-transcripts && uv pip install --python .venv-transcripts/bin/python argostranslate`, then install the en→ko Argos model.",
    );
  }

  const translated = JSON.parse(
    execFileSync(
      LOCAL_TRANSLATOR,
      [join(ROOT, "scripts", "translate-transcript-argos.py")],
      {
        input: JSON.stringify(segments.map((segment) => segment.text)),
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 20,
      },
    ),
  ) as string[];

  return segments.map((segment, index) => ({
    ...segment,
    text: translated[index] ?? segment.text,
  }));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
