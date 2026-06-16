import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>오픈소스로 만든 나만의 개발 아카데미 · Yoona Academy</p>
        <nav className="flex items-center gap-4">
          <Link href="/tracks" className="hover:text-foreground">트랙</Link>
          <Link href="/resources" className="hover:text-foreground">리소스</Link>
          <Link href="/attributions" className="hover:text-foreground">출처·라이선스</Link>
        </nav>
      </div>
    </footer>
  );
}
