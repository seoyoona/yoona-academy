"use client";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Send, Sparkles, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "이 레슨을 한 문장으로 요약해줘",
  "초보자도 이해할 수 있게 다시 설명해줘",
  "실생활 예시를 하나 들어줘",
];

function messageText(parts: { type: string; text?: string }[]) {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function TutorLauncher({
  lessonId,
  lessonTitle,
  aiEnabled,
}: {
  lessonId: string;
  lessonTitle: string;
  aiEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/tutor",
      body: { lessonId },
    }),
  });
  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-30 gap-2 rounded-full shadow-lg"
          >
            <Sparkles className="size-4" /> AI 튜터
          </Button>
        }
      />
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="size-5 text-primary" /> AI 튜터
          </SheetTitle>
          <SheetDescription className="truncate">
            «{lessonTitle}» 레슨에 대해 무엇이든 물어보세요.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!aiEnabled && (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              AI 튜터를 사용하려면 <code>ANTHROPIC_API_KEY</code> 환경 변수를 설정하세요.
            </p>
          )}
          {messages.length === 0 && aiEnabled && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">이렇게 질문해보세요:</p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="block w-full rounded-xl border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full ${
                  m.role === "user" ? "bg-secondary" : "bg-primary text-primary-foreground"
                }`}
              >
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </span>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-secondary"
                    : "border border-border bg-card"
                }`}
              >
                {messageText(m.parts) || "…"}
              </div>
            </div>
          ))}
          {busy && messages.at(-1)?.role === "user" && (
            <div className="flex gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Bot className="size-4" />
              </span>
              <div className="rounded-2xl border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground">
                생각 중…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="border-t border-border p-3"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              disabled={!aiEnabled || busy}
              rows={1}
              placeholder={aiEnabled ? "질문을 입력하세요…" : "AI 비활성화됨"}
              className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
            />
            <Button type="submit" size="icon" disabled={!aiEnabled || busy || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
