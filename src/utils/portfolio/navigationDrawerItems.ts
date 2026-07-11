export type NavigationRoute = {
  label: string;
  href: string;
};

export type NavigationDrawerItem = {
  label: string;
  href: string;
  iconType: "material" | "emoji" | "image";
  icon: string;
};

export function buildNavigationDrawerItems(
  projectRoutes: NavigationRoute[],
): NavigationDrawerItem[] {
  const base: NavigationDrawerItem[] = [
    { label: "Home", href: "/", iconType: "material", icon: "home" },
  ];
  const shenanigans: NavigationDrawerItem = {
    label: "AI Shenanigans",
    href: "/ai-shenanigans",
    iconType: "material",
    icon: "autoFixHigh",
  };
  const projectItems = projectRoutes.map((route) => ({
    label: route.label,
    href: route.href,
    iconType: "material" as const,
    icon: "apps",
  }));

  return [...base, ...projectItems, shenanigans];
}
