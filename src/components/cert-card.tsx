"use client";
import { useState } from "react";
import { Award, Clock, ExternalLink, Gift } from "lucide-react";
import type { Certification } from "@/content/certifications";
import { TIER_META } from "@/content/certifications";
import { useCerts, type CertStatus } from "@/lib/cert-progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS: { value: CertStatus; label: string }[] = [
  { value: "not_started", label: "시작전" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "완료" },
];

export function CertCard({ cert }: { cert: Certification }) {
  const { get, patch } = useCerts();
  const state = get(cert.id);
  const accent = TIER_META[cert.tier].accent;
  const [showDetails, setShowDetails] = useState(
    Boolean(state.badgeUrl || state.notes),
  );

  return (
    <Card
      className="relative gap-3 p-5"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">
            {cert.provider}
          </div>
          <h3 className="mt-0.5 text-base font-semibold tracking-tight">
            {cert.title}
          </h3>
        </div>
        <a
          href={cert.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          코스 <ExternalLink className="size-3" />
        </a>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{cert.why}</p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Award className="size-3.5" /> {cert.credential}
        </span>
        {cert.estHours > 0 && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> 약 {cert.estHours}시간
          </span>
        )}
        {cert.isFree && (
          <Badge variant="secondary" className="gap-1">
            <Gift className="size-3" /> 무료
          </Badge>
        )}
      </div>

      {/* status selector */}
      <div className="mt-1 inline-flex rounded-lg bg-muted p-0.5 text-xs">
        {STATUS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => patch(cert.id, { status: s.value })}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors",
              state.status === s.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* percent */}
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium" style={{ color: accent }}>
            {state.percent}% 진행
          </span>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-muted-foreground underline-offset-2 hover:underline"
          >
            {showDetails ? "접기" : "배지·메모"}
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={state.percent}
          onChange={(e) => patch(cert.id, { percent: Number(e.target.value) })}
          className="mt-1.5 w-full accent-[var(--accent)]"
          style={{ accentColor: accent }}
        />
      </div>

      {showDetails && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <label className="text-xs text-muted-foreground">
            배지 / 수료증 링크
            <input
              type="url"
              placeholder="https://…"
              defaultValue={state.badgeUrl ?? ""}
              onBlur={(e) =>
                patch(cert.id, { badgeUrl: e.target.value.trim() || undefined })
              }
              className="mt-1 w-full rounded-md border bg-background px-2.5 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            메모
            <textarea
              rows={2}
              placeholder="진행 메모…"
              defaultValue={state.notes ?? ""}
              onBlur={(e) =>
                patch(cert.id, { notes: e.target.value.trim() || undefined })
              }
              className="mt-1 w-full resize-none rounded-md border bg-background px-2.5 py-1.5 text-sm text-foreground"
            />
          </label>
          {state.badgeUrl && (
            <a
              href={state.badgeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary"
            >
              배지 보기 <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
