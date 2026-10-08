export type NavigationItem = Readonly<{
  href: `/${string}`;
  label: string;
}>;

export const primaryNavigationItems: readonly NavigationItem[] = [
  {
    href: "/",
    label: "Inicio",
  },
];
