import Link from "next/link";
import type { ReactNode } from "react";

import { PrimaryNavigation } from "./primary-navigation";

type AppShellProps = Readonly<{
  accountMenu?: ReactNode;
  activeHref?: string;
  children: ReactNode;
}>;

function BrandMark() {
  return (
    <span aria-hidden="true" className="brand-mark">
      U
    </span>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function AppShell({
  accountMenu,
  activeHref = "/",
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <aside className="desktop-sidebar">
        <Link aria-label="UltimateDashboard, inicio" className="brand" href="/">
          <BrandMark />
          <span className="brand-copy">
            <strong>Ultimate</strong>
            <span>Dashboard</span>
          </span>
        </Link>

        <div className="workspace-card">
          <span>Espacio actual</span>
          <strong>Personal</strong>
        </div>

        <PrimaryNavigation activeHref={activeHref} />

        <div className="sidebar-footer">
          {accountMenu ?? (
            <p className="sidebar-note">
              <span aria-hidden="true" className="status-dot" />
              Nombre provisional
            </p>
          )}
        </div>
      </aside>

      <div className="app-viewport">
        <header className="mobile-header">
          <Link
            aria-label="UltimateDashboard, inicio"
            className="brand"
            href="/"
          >
            <BrandMark />
            <span className="mobile-brand-name">UltimateDashboard</span>
          </Link>

          <details className="mobile-menu">
            <summary>
              <MenuIcon />
              <span>Menú</span>
            </summary>
            <div className="mobile-menu-panel">
              <PrimaryNavigation activeHref={activeHref} compact />
              {accountMenu && (
                <div className="mobile-account-menu">{accountMenu}</div>
              )}
            </div>
          </details>
        </header>

        {children}
      </div>
    </div>
  );
}
