"use client";
import { CERTIFICATIONS } from "@/content/certifications";
import { useCerts } from "@/lib/cert-progress";

/** Headline numbers across the "do these" (high-tier) certs. */
export function CertSummary() {
  const { get } = useCerts();
  const high = CERTIFICATIONS.filter((c) => c.tier === "high");
  const completed = high.filter((c) => get(c.id).status === "completed").length;
  const inProgress = high.filter((c) => get(c.id).status === "in_progress").length;
  const avg = high.length
    ? Math.round(high.reduce((s, c) => s + get(c.id).percent, 0) / high.length)
    : 0;

  const stats = [
    { label: "우선순위 코스", value: `${high.length}개` },
    { label: "완료", value: `${completed}개` },
    { label: "진행중", value: `${inProgress}개` },
    { label: "평균 진행률", value: `${avg}%` },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
          <div className="text-2xl font-bold tracking-tight">{s.value}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
