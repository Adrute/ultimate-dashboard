import Link from "next/link";

import { primaryNavigationItems } from "./navigation";

type PrimaryNavigationProps = Readonly<{
  compact?: boolean;
}>;

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3.75 10.75 12 4l8.25 6.75v8.5a.75.75 0 0 1-.75.75h-4.75v-5.25h-5.5V20H4.5a.75.75 0 0 1-.75-.75z" />
    </svg>
  );
}

export function PrimaryNavigation({ compact = false }: PrimaryNavigationProps) {
  return (
    <nav
      aria-label={compact ? "Navegación móvil" : "Navegación principal"}
      className={
        compact ? "primary-navigation is-compact" : "primary-navigation"
      }
    >
      {!compact && <p className="navigation-label">Navegación</p>}
      <ul>
        {primaryNavigationItems.map((item) => (
          <li key={item.href}>
            <Link
              aria-current="page"
              className="navigation-link"
              href={item.href}
            >
              <HomeIcon />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
