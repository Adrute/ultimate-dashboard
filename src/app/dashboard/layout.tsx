import type { ReactNode } from "react";

import { SignOutForm } from "@/components/auth/sign-out-form";
import { AppShell } from "@/components/app-shell/app-shell";
import { requireAuthenticatedUser } from "@/lib/auth/session";

type DashboardLayoutProps = Readonly<{
  children: ReactNode;
}>;

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await requireAuthenticatedUser();
  const label = user.displayName ?? user.email ?? "Cuenta personal";

  return (
    <AppShell
      accountMenu={<SignOutForm label={label} />}
      activeHref="/dashboard"
    >
      {children}
    </AppShell>
  );
}
