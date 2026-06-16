import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { anthropic, aiEnabled, MODELS } from "@/lib/ai";
import { getLessonView } from "@/content/loader";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!aiEnabled) {
    return new Response("AI tutor is not configured (set ANTHROPIC_API_KEY).", {
      status: 503,
    });
  }

  const { messages, lessonId } = (await req.json()) as {
    messages: UIMessage[];
    lessonId: string;
  };

  const lesson = getLessonView(lessonId);
  const context = lesson
    ? `# ${lesson.title}\n(트랙: ${lesson.track.title})\n\n${lesson.contentMarkdown.slice(0, 8000)}`
    : "(레슨을 찾을 수 없습니다.)";

  const result = streamText({
    model: anthropic(MODELS.tutor),
    system: [
      "당신은 'Yoona Academy'의 친절하고 유능한 AI 튜터입니다.",
      "학습자가 현재 보고 있는 레슨 내용을 바탕으로 질문에 답하세요.",
      "규칙:",
      "- 한국어로, 명확하고 격려하는 톤으로 답합니다.",
      "- 레슨 내용에 근거해 설명하되, 필요하면 쉬운 비유와 예시를 듭니다.",
      "- 코드 예시는 마크다운 코드 블록으로 제시합니다.",
      "- 모르면 모른다고 솔직히 말하고, 레슨 범위를 벗어나면 안내합니다.",
      "- 답변은 간결하게, 보통 3~6문장 또는 짧은 목록으로.",
      "",
      "## 현재 레슨 내용",
      context,
    ].join("\n"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
