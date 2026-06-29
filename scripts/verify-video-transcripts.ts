import {
  parseVttTranscript,
  transcriptTextPreview,
} from "../src/lib/video-transcripts";
import transcripts from "../content/generated/video-transcripts.json";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const sample = [
    "WEBVTT",
    "Kind: captions",
    "Language: ko",
    "",
    "00:00:00.180 --> 00:00:04.500",
    "안녕하세요, 저는 <c>에미</c>입니다. 이번",
    "영상에서는 Ray 클러스터를 이해하는 데",
    "",
    "00:00:04.500 --> 00:00:08.520",
    "매우 유용한 도구인 Ray 대시보드를 자세히 살펴보겠습니다",
    ".",
    "",
    "00:00:08.520 --> 00:00:13.440",
    "Ray Dashboard와 같은 관찰 도구는 시스템&nbsp;의 내부 상태를 모니터링합니다.",
  ].join("\n");

  const segments = parseVttTranscript(sample, { maxChars: 180, maxSeconds: 30 });

  assert(segments.length === 1, "expected nearby cues to merge into one transcript segment");
  assert(segments[0].start === "00:00", "expected segment start time to be normalized");
  assert(segments[0].end === "00:13", "expected segment end time to be normalized");
  assert(
    segments[0].text.includes("에미입니다"),
    "expected caption tags and artificial line breaks to be cleaned",
  );
  assert(
    segments[0].text.includes("살펴보겠습니다."),
    "expected isolated punctuation cues to attach to the previous sentence",
  );
  assert(
    !segments[0].text.includes("&nbsp;") && !segments[0].text.includes("<c>"),
    "expected HTML caption markup/entities to be removed",
  );

  const preview = transcriptTextPreview(segments, 60);
  assert(preview.endsWith("..."), "expected long transcript previews to be truncated");

  const lessonTranscripts = transcripts["ml-engineering__development__training"];
  assert(lessonTranscripts.videos.length === 7, "expected the Ray dashboard playlist to have 7 transcripts");
  assert(
    lessonTranscripts.videos.every((video, index) => video.order === index + 1),
    "expected playlist transcripts to stay in playlist order",
  );
  assert(
    lessonTranscripts.videos.every((video) => video.segments.length > 0),
    "expected every transcript video to have parsed segments",
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
