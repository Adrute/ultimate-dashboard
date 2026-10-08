export type NavigationItem = Readonly<{
  href: `/${string}`;
  icon: "dashboard" | "home";
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
];
