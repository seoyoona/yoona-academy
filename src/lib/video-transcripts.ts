export type TranscriptSegment = {
  start: string;
  end: string;
  text: string;
};

export type VideoTranscript = {
  videoId: string;
  order?: number;
  title: string;
  url: string;
  language: string;
  source: string;
  segments: TranscriptSegment[];
};

export type LessonTranscripts = {
  generatedAt: string;
  provider: string;
  videos: VideoTranscript[];
};

type ParseOptions = {
  maxChars?: number;
  maxSeconds?: number;
};

type Cue = {
  startMs: number;
  endMs: number;
  text: string;
};

export function parseVttTranscript(
  vtt: string,
  options: ParseOptions = {},
): TranscriptSegment[] {
  const cues = parseCues(vtt);
  return mergeCues(cues, {
    maxChars: options.maxChars ?? 420,
    maxSeconds: options.maxSeconds ?? 45,
  });
}

export function transcriptTextPreview(
  segments: TranscriptSegment[],
  maxChars = 180,
): string {
  const text = segments.map((segment) => segment.text).join(" ");
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function parseCues(vtt: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = vtt.replace(/\r/g, "").split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue;

    const [startRaw, endRaw] = lines[timingIndex].split("-->").map((part) => part.trim());
    const startMs = parseTimestampMs(startRaw);
    const endMs = parseTimestampMs(endRaw.split(/\s+/)[0]);
    if (startMs == null || endMs == null || endMs <= startMs) continue;

    const text = cleanCaptionText(lines.slice(timingIndex + 1).join(" "));
    if (!text) continue;

    cues.push({ startMs, endMs, text });
  }

  return cues;
}

function mergeCues(
  cues: Cue[],
  options: Required<ParseOptions>,
): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  let current: Cue | null = null;

  const flush = () => {
    if (!current) return;
    const text = cleanupSpacing(current.text);
    if (text) {
      segments.push({
        start: formatTimestamp(current.startMs),
        end: formatTimestamp(current.endMs),
        text,
      });
    }
    current = null;
  };

  for (const cue of cues) {
    if (!current) {
      current = { ...cue };
      continue;
    }

    const nextText = joinCaptionText(current.text, cue.text);
    const tooLong = nextText.length > options.maxChars;
    const tooWide = cue.endMs - current.startMs > options.maxSeconds * 1000;
    if (tooLong || tooWide) {
      flush();
      current = { ...cue };
      continue;
    }

    current.endMs = cue.endMs;
    current.text = nextText;
  }

  flush();
  return segments;
}

function parseTimestampMs(value: string): number | null {
  const match = value.match(/^(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const millis = Number(match[4]);
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours ? `${String(hours).padStart(2, "0")}:${mmss}` : mmss;
}

function cleanCaptionText(value: string): string {
  return cleanupSpacing(
    decodeHtmlEntities(value)
      .replace(/<[^>]+>/g, "")
      .replace(/\{\\an\d+}/g, "")
      .replace(/\s+/g, " "),
  );
}

function cleanupSpacing(value: string): string {
  return value
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .replace(/\s+([)\]}])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function joinCaptionText(left: string, right: string): string {
  const cleanedRight = cleanupSpacing(right);
  if (!cleanedRight) return left;
  if (/^[.,!?;:]/.test(cleanedRight)) return cleanupSpacing(`${left}${cleanedRight}`);
  return cleanupSpacing(`${left} ${cleanedRight}`);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
