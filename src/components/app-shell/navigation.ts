export type NavigationItem = Readonly<{
  href: `/${string}`;
  icon:
    | "calendar"
    | "dashboard"
    | "home"
    | "notes"
    | "projects"
    | "search"
    | "tasks";
  label: string;
}>;

export const primaryNavigationItems: readonly NavigationItem[] = [
  {
    href: "/dashboard",
    icon: "home",
    label: "Inicio",
  },
  {
    href: "/calendar",
    icon: "calendar",
    label: "Calendario",
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
