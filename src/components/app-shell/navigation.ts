export type NavigationItem = Readonly<{
  href: `/${string}`;
  icon: "dashboard" | "home" | "notes" | "projects" | "search" | "tasks";
  label: string;
}>;

export const primaryNavigationItems: readonly NavigationItem[] = [
  {
    href: "/",
    icon: "home",
    label: "Inicio",
  },
  {
    href: "/dashboard",
    icon: "dashboard",
    label: "Panel",
  },
  {
    href: "/tasks",
    icon: "tasks",
    label: "Tareas",
  },
  {
    href: "/search",
    icon: "search",
    label: "Buscar",
  },
  {
    href: "/notes",
    icon: "notes",
    label: "Notas",
  },
  {
    href: "/projects",
    icon: "projects",
    label: "Proyectos",
  },
];
