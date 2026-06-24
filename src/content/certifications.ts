/**
 * External AI certification courses Yoona is pursuing for the PM portfolio.
 * This is the committed catalog (the "content"); per-user progress is stored
 * separately (localStorage + cert_progress table). `tier` is an editorial
 * judgment of portfolio value for an AI PM — high = do it, medium = learn but
 * weak as a credential, skip = low ROI for this goal.
 */

export type CertTier = "high" | "medium" | "skip";

export type Certification = {
  /** Stable id — used as the progress key. Never change once shipped. */
  id: string;
  provider: string;
  title: string;
  url: string;
  tier: CertTier;
  /** Rough time-to-finish, hours. */
  estHours: number;
  isFree: boolean;
  /** What you walk away with (badge / certificate name). */
  credential: string;
  /** One-line rationale for the tier. */
  why: string;
};

export const TIER_META: Record<
  CertTier,
  { label: string; emoji: string; accent: string; blurb: string }
> = {
  high: {
    label: "우선순위 높음 — 이건 따기",
    emoji: "✅",
    accent: "#16a34a",
    blurb: "PM/비즈니스 지향 · 브랜드 인지도 · ROI 좋음",
  },
  medium: {
    label: "학습용 — 자격증으론 약함",
    emoji: "🟡",
    accent: "#d97706",
    blurb: "실력엔 좋지만 포트폴리오 라인으론 임팩트 작음",
  },
  skip: {
    label: "후순위 / 스킵",
    emoji: "⛔",
    accent: "#94a3b8",
    blurb: "AI PM 포트폴리오 기준 ROI 낮음",
  },
};

export const TIER_ORDER: CertTier[] = ["high", "medium", "skip"];

export const CERTIFICATIONS: Certification[] = [
  {
    id: "salesforce-ai-associate",
    provider: "Salesforce (Trailhead)",
    title: "AI Associate",
    url: "https://trailhead.salesforce.com/en/credentials/aiassociate",
    tier: "high",
    estHours: 12,
    isFree: true,
    credential: "Salesforce AI Associate 자격증",
    why: "엔트리 AI 자격증인데 비즈니스/PM 지향이라 포트폴리오에 가장 잘 맞음. 브랜드 인지도 높고 며칠이면 완료.",
  },
  {
    id: "databricks-genai-fundamentals",
    provider: "Databricks",
    title: "Generative AI Fundamentals (한국어)",
    url: "https://www.databricks.com/kr/training/catalog/generative-ai-fundamentals-korean-2780",
    tier: "high",
    estHours: 4,
    isFree: true,
    credential: "Databricks GenAI Fundamentals Accreditation 배지",
    why: "짧고 무료, 인증 배지 발급. 빠른 win + GenAI 기본기 + Databricks 브랜드.",
  },
  {
    id: "google-data-analytics",
    provider: "Google (Coursera)",
    title: "Data Analytics Professional Certificate",
    url: "https://grow.google/certificates/data-analytics/",
    tier: "high",
    estHours: 120,
    isFree: false,
    credential: "Google Data Analytics Professional Certificate",
    why: "브랜드 최강. 단 ~3–6개월짜리 헤비 코스이고 'AI'보단 데이터 분석. 데이터 직무로 어필하고 시간 각오될 때만.",
  },
  {
    id: "huggingface-learn",
    provider: "Hugging Face",
    title: "LLM & Agents Courses",
    url: "https://huggingface.co/learn",
    tier: "medium",
    estHours: 30,
    isFree: true,
    credential: "수료 인증서 (브랜드 약함)",
    why: "실제 에이전트 작업과 가장 직결되는 실력용. 공식 '자격증' 브랜드가 약해 포트폴리오 라인으론 약함.",
  },
  {
    id: "ibm-skillsbuild-ai",
    provider: "IBM SkillsBuild (NetAcad)",
    title: "AI Fundamentals",
    url: "https://www.netacad.com/courses/ai-ibm-skillsbuild?courseLang=en-US",
    tier: "medium",
    estHours: 10,
    isFree: true,
    credential: "IBM SkillsBuild AI 배지",
    why: "무료 + 기초 배지. 입문용으론 OK지만 너무 베이직해서 임팩트는 작음.",
  },
  {
    id: "cisco-netacad-badges",
    provider: "Cisco Networking Academy",
    title: "Networking Badges / Certifications",
    url: "https://www.netacad.com/badges-certifications",
    tier: "skip",
    estHours: 0,
    isFree: true,
    credential: "Cisco NetAcad 배지",
    why: "네트워킹 엔지니어용. AI PM 포트폴리오와 거의 무관 → 스킵.",
  },
  {
    id: "oracle-oci-training",
    provider: "Oracle",
    title: "OCI Training (일반)",
    url: "https://www.oracle.com/kr/education/training/oracle-cloud-infrastructure/",
    tier: "skip",
    estHours: 0,
    isFree: true,
    credential: "OCI 일반 교육 수료",
    why: "일반 OCI는 인프라 엔지니어용이라 PM엔 약함. 굳이 한다면 일반 교육 말고 'OCI Generative AI Professional' 자격증만 타깃.",
  },
];
