"use client";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <div className="size-8" aria-hidden />;
  return isSignedIn ? (
    <UserButton />
  ) : (
    <SignInButton mode="modal">
      <Button size="sm" variant="outline">
        로그인
      </Button>
    </SignInButton>
  );
}
