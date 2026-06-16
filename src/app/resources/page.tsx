import type { Metadata } from "next";
import { getAllResources } from "@/content/loader";
import { ResourceExplorer } from "@/components/resource-explorer";

export const metadata: Metadata = { title: "리소스 라이브러리" };

export default function ResourcesPage() {
  const resources = getAllResources();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">리소스 라이브러리</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        프로젝트 기반 튜토리얼, 머신러닝 라이브러리, 레퍼런스 치트시트를 한곳에서.
        엄선된 오픈소스 자료로 학습을 확장하세요.
      </p>
      <div className="mt-8">
        <ResourceExplorer resources={resources} />
      </div>
    </div>
  );
}
