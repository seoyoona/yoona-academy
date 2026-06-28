import { embedYouTubeLinks, getYouTubeEmbed } from "../src/lib/video-embeds";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const markdown = embedYouTubeLinks([
    "# Video",
    "",
    "Watch this lecture:",
    "",
    "https://www.youtube.com/watch?v=CEvIs9y1uog",
    "",
    "Short URL:",
    "",
    "https://youtu.be/WZZLtwnZ4w0",
    "",
    "[Named lecture](https://www.youtube.com/playlist?list=PLAMHV77MSKJ7Pn_OwuGzbDPs_MOibBRP-)",
    "",
    "- [3Blue1Brown: Backpropagation calculus](https://www.youtube.com/watch?v=tIeHLnjs5U8) -- visual explanation",
    "",
    "```",
    "https://www.youtube.com/watch?v=shouldNotConvert",
    "```",
  ].join("\n"));

  assert(
    markdown.includes('src="https://www.youtube.com/embed/CEvIs9y1uog"'),
    "expected youtube.com/watch URL to convert to an iframe embed",
  );
  assert(
    markdown.includes('src="https://www.youtube.com/embed/WZZLtwnZ4w0"'),
    "expected youtu.be URL to convert to an iframe embed",
  );
  assert(
    !markdown.split("\n").some((line) => line.trim() === "https://www.youtube.com/watch?v=CEvIs9y1uog"),
    "expected bare YouTube watch URL not to remain as a standalone prose line",
  );
  assert(
    markdown.includes(
      'src="https://www.youtube.com/embed/videoseries?list=PLAMHV77MSKJ7Pn_OwuGzbDPs_MOibBRP-"',
    ),
    "expected YouTube playlist URL to convert to a playlist iframe embed",
  );
  assert(
    markdown.includes('src="https://www.youtube.com/embed/tIeHLnjs5U8"'),
    "expected bullet markdown YouTube links to convert to iframe embeds",
  );
  assert(
    markdown.includes("https://www.youtube.com/watch?v=shouldNotConvert"),
    "expected YouTube URLs inside fenced code blocks to stay untouched",
  );

  const resourceEmbed = getYouTubeEmbed(
    "https://www.youtube.com/watch?v=1jvxxa7tdjw",
    "LLMOps",
  );
  assert(
    resourceEmbed?.src === "https://www.youtube.com/embed/1jvxxa7tdjw",
    "expected resource YouTube URLs to expose reusable embed metadata",
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
