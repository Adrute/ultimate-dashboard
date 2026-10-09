import Link from "next/link";

import { primaryNavigationItems } from "./navigation";

type PrimaryNavigationProps = Readonly<{
  activeHref: string;
  compact?: boolean;
}>;

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3.75 10.75 12 4l8.25 6.75v8.5a.75.75 0 0 1-.75.75h-4.75v-5.25h-5.5V20H4.5a.75.75 0 0 1-.75-.75z" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 7 1.5 1.5L9.5 5M11 7h8M5 13l1.5 1.5 3-3M11 13h8M5 19l1.5 1.5 3-3M11 19h8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" r="6.25" />
      <path d="m15 15 4.75 4.75" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 3.75h9l3 3v13.5H6zM9 10h6M9 14h6M9 18h4" />
    </svg>
  );
}

function NavigationIcon({
  icon,
}: {
  icon: "dashboard" | "home" | "notes" | "search" | "tasks";
}) {
  if (icon === "home") return <HomeIcon />;
  if (icon === "tasks") return <TasksIcon />;
  if (icon === "search") return <SearchIcon />;
  if (icon === "notes") return <NotesIcon />;
  return <DashboardIcon />;
}

export function PrimaryNavigation({
  activeHref,
  compact = false,
}: PrimaryNavigationProps) {
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
              aria-current={item.href === activeHref ? "page" : undefined}
              className="navigation-link"
              href={item.href}
            >
              <NavigationIcon icon={item.icon} />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
