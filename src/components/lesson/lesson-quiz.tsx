"use client";
import { useState } from "react";
import { Check, X, RotateCcw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/content/types";

export function LessonQuiz({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [graded, setGraded] = useState(false);

  const total = quiz.questions.length;
  const answered = Object.keys(answers).length;
  const score = quiz.questions.reduce(
    (n, q, i) => n + (answers[i] === q.answerIndex ? 1 : 0),
    0,
  );

  return (
    <section className="mt-12 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <HelpCircle className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">퀴즈로 확인하기</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        배운 내용을 점검해보세요. {total}문제.
      </p>

      <ol className="mt-6 space-y-6">
        {quiz.questions.map((q, qi) => (
          <li key={q.id}>
            <p className="font-medium">
              <span className="text-muted-foreground">{qi + 1}. </span>
              {q.prompt}
            </p>
            <div className="mt-3 space-y-2">
              {q.choices.map((choice, ci) => {
                const selected = answers[qi] === ci;
                const isCorrect = ci === q.answerIndex;
                const showState = graded && (selected || isCorrect);
                return (
                  <button
                    key={ci}
                    type="button"
                    disabled={graded}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: ci }))}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                      showState && isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : showState && selected && !isCorrect
                          ? "border-red-500/50 bg-red-500/10"
                          : selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent"
                    }`}
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border text-xs ${
                        selected ? "border-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {showState && isCorrect ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : showState && selected && !isCorrect ? (
                        <X className="size-3.5 text-red-600" />
                      ) : (
                        String.fromCharCode(65 + ci)
                      )}
                    </span>
                    {choice}
                  </button>
                );
              })}
            </div>
            {graded && (
              <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">해설 · </span>
                {q.explanation}
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center gap-3">
        {!graded ? (
          <Button onClick={() => setGraded(true)} disabled={answered < total}>
            채점하기 {answered < total && `(${answered}/${total})`}
          </Button>
        ) : (
          <>
            <span className="text-lg font-semibold">
              {score} / {total} 정답
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {score === total ? "완벽해요! 🎯" : score >= total / 2 ? "좋아요 👍" : "복습해볼까요?"}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => {
                setAnswers({});
                setGraded(false);
              }}
            >
              <RotateCcw className="size-4" /> 다시 풀기
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
