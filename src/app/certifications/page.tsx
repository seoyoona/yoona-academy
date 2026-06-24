import type { Metadata } from "next";
import {
  CERTIFICATIONS,
  TIER_META,
  TIER_ORDER,
} from "@/content/certifications";
import { CertCard } from "@/components/cert-card";
import { CertSummary } from "@/components/cert-summary";

export const metadata: Metadata = { title: "인증 코스" };

export default function CertificationsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">AI 인증 코스</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        포트폴리오용 외부 AI 자격증·코스 진행도 트래커. 티어는 AI PM 포트폴리오
        기준 가치 판단이에요 — 다 딸 필요는 없습니다.
      </p>

      <CertSummary />

      <div className="mt-8 space-y-10">
        {TIER_ORDER.map((tier) => {
          const certs = CERTIFICATIONS.filter((c) => c.tier === tier);
          if (certs.length === 0) return null;
          const meta = TIER_META[tier];
          return (
            <section key={tier}>
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  {meta.emoji} {meta.label}
                </h2>
                <span className="text-xs text-muted-foreground">{meta.blurb}</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {certs.map((cert) => (
                  <CertCard key={cert.id} cert={cert} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
