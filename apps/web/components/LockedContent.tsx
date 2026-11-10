"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";

import { Button } from "@sbozh/react-ui/components/ui/button";
import { Input } from "@sbozh/react-ui/components/ui/input";

import { unlockContent, type UnlockState } from "@/actions/content-lock";

/** Stands in for a locked post's body until the reader enters the content password */
export function LockedContent({ path }: { readonly path: string }) {
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(unlockContent, {});

  return (
    <div className="not-prose my-12 flex flex-col items-center gap-4 rounded-lg border border-border bg-card/40 px-6 py-10 text-center">
      <Lock className="size-8 text-primary" aria-hidden="true" />
      <div>
        <p className="text-lg font-medium">This post is locked</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the password to read the rest.
        </p>
      </div>
      <form action={formAction} className="flex w-full max-w-sm gap-2">
        <input type="hidden" name="path" value={path} />
        <Input
          type="password"
          name="password"
          required
          placeholder="Password"
          aria-label="Password"
          autoComplete="current-password"
          aria-invalid={state.error ? true : undefined}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Unlocking…" : "Unlock"}
        </Button>
      </form>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
