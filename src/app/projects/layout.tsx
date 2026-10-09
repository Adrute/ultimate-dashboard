import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { SignOutForm } from "@/components/auth/sign-out-form";
import { requireAuthenticatedUser } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export default async function ProjectsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireAuthenticatedUser();
  return (
    <AppShell
      accountMenu={
        <SignOutForm
          label={user.displayName ?? user.email ?? "Cuenta personal"}
        />
      }
      activeHref="/projects"
    >
      {children}
    </AppShell>
  );
}
