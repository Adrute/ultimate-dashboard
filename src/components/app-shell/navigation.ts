export type NavigationItem = Readonly<{
  href: `/${string}`;
  icon: "dashboard" | "home" | "tasks";
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
];
