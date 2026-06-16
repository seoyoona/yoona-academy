"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { useProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";

type NavRef = { id: string; title: string };

export function LessonFooter({
  lessonId,
  prev,
  next,
}: {
  lessonId: string;
  prev?: NavRef;
  next?: NavRef;
}) {
  const { isComplete, toggle } = useProgress();
  const router = useRouter();
  const complete = isComplete(lessonId);

  function onComplete() {
    toggle(lessonId);
    if (!complete) {
      toast.success("레슨 완료! 잘하고 있어요 🎉");
      if (next) router.push(`/learn/${next.id}`);
    }
  }

  return (
    <div className="mt-10 border-t border-border pt-6">
      <div className="flex justify-center">
        <Button
          size="lg"
          variant={complete ? "secondary" : "default"}
          onClick={onComplete}
          className="gap-2"
        >
          {complete ? (
            <>
              <CircleCheck className="size-4" /> 완료됨 — 다시 표시 해제
            </>
          ) : (
            <>
              <Check className="size-4" /> 완료로 표시{next ? " 후 다음 레슨" : ""}
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/learn/${prev.id}`}
            className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent"
          >
            <ArrowLeft className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">이전</span>
              <span className="block truncate text-sm font-medium">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/learn/${next.id}`}
            className="group flex items-center gap-3 rounded-xl border border-border p-3 text-right transition-colors hover:bg-accent sm:justify-end"
          >
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">다음</span>
              <span className="block truncate text-sm font-medium">{next.title}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
