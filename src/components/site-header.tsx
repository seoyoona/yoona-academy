import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButtons } from "@/components/auth-buttons";
import { authEnabled } from "@/lib/auth-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </span>
          <span>Yoona Academy</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/tracks" className="rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground">
            트랙
          </Link>
          <Link href="/resources" className="rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground">
            리소스
          </Link>
          <Link href="/certifications" className="rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground">
            인증
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {authEnabled && <AuthButtons />}
        </div>
      </div>
    </header>
  );
}
