import { keyframes } from "@mui/material/styles";
import type { HomeSectionPagerItem } from "@/components/portfolio/layout/HomeSectionPager";
import type { NavigationIconType } from "@/components/portfolio/layout/navigationIcons";

type HomeSectionConfig = {
  id?: string;
  label?: string;
  icon?: string;
  iconType?: unknown;
};

type DrawerItemConfig = {
  label?: string;
  href?: string;
  icon?: string;
  iconType?: unknown;
};

export const SECTION_TRANSITION_MS = 320;
export const SECTION_SWIPE_THRESHOLD_PX = 72;

export const sectionSlideInFromRight = keyframes`
  0% { opacity: 0.66; transform: translateX(14%); }
  100% { opacity: 1; transform: translateX(0); }
`;
export const sectionSlideOutToLeft = keyframes`
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0.4; transform: translateX(-14%); }
`;
export const sectionSlideInFromLeft = keyframes`
  0% { opacity: 0.66; transform: translateX(-14%); }
  100% { opacity: 1; transform: translateX(0); }
`;
export const sectionSlideOutToRight = keyframes`
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0.4; transform: translateX(14%); }
`;

export const DEFAULT_HOME_SECTIONS: HomeSectionPagerItem[] = [
  { id: "hero", label: "Summary", icon: "home", iconType: "material" },
  { id: "education", label: "Education", icon: "school", iconType: "material" },
  { id: "experience", label: "Experience", icon: "work", iconType: "material" },
  {
    id: "competencies",
    label: "Core Competencies",
    icon: "build",
    iconType: "material",
  },
  { id: "projects", label: "Projects", icon: "autoStories", iconType: "material" },
  {
    id: "recognition",
    label: "Recognition",
    icon: "emojiEvents",
    iconType: "material",
  },
  { id: "hobbies", label: "Hobbies", icon: "interests", iconType: "material" },
  { id: "contact", label: "Contact", icon: "alternateEmail", iconType: "material" },
];

const DEFAULT_HOME_DRAWER_ITEM = {
  label: "Home",
  href: "/",
  icon: "home",
  iconType: "material",
} as const;

export const LAST_HOME_HASH_STORAGE_KEY = "portfolio:last-home-hash";

export type DrawerNavigationItem = {
  label: string;
  href: string;
  icon?: string;
  iconType?: NavigationIconType;
};

export const normalizeNavigationIconType = (iconType: unknown): NavigationIconType =>
  iconType === "emoji" ? "emoji" : "material";

export const resolveHomeSections = (
  homeSections: HomeSectionConfig[] | undefined,
): HomeSectionPagerItem[] => {
  if (!Array.isArray(homeSections) || homeSections.length === 0) {
    return DEFAULT_HOME_SECTIONS;
  }

  const normalizedSections = homeSections
    .filter(
      (section): section is HomeSectionConfig =>
        Boolean(section?.id?.trim()) && Boolean(section?.label?.trim()),
    )
    .map((section) => ({
      id: section.id!.trim(),
      label: section.label!.trim(),
      icon: section.icon?.trim(),
      iconType: normalizeNavigationIconType(section.iconType),
    }));

  return normalizedSections.length > 0 ? normalizedSections : DEFAULT_HOME_SECTIONS;
};

const isHomeDrawerItem = (item: { href: string; label: string }) =>
  item.href === "/" || item.label.toLowerCase() === "home";

export const resolveDrawerItems = (
  drawerItems: DrawerItemConfig[] | undefined,
): DrawerNavigationItem[] => {
  const configuredDrawerItems = Array.isArray(drawerItems) ? drawerItems : [];
  const normalizedDrawerItems = configuredDrawerItems
    .filter(
      (item): item is DrawerItemConfig =>
        Boolean(item?.label?.trim()) && Boolean(item?.href?.trim()),
    )
    .map((item) => ({
      label: item.label!.trim(),
      href: item.href!.trim(),
      icon: item.icon?.trim() || "home",
      iconType: normalizeNavigationIconType(item.iconType),
    }));

  const configuredHomeItem = normalizedDrawerItems.find(isHomeDrawerItem);
  const homeDrawerItem = configuredHomeItem ?? DEFAULT_HOME_DRAWER_ITEM;
  const remainingDrawerItems = normalizedDrawerItems.filter(
    (item) => item !== configuredHomeItem && !isHomeDrawerItem(item),
  );

  return [
    {
      ...homeDrawerItem,
      label: homeDrawerItem.label || "Home",
      href: "/",
      icon: homeDrawerItem.icon || "home",
      iconType: normalizeNavigationIconType(homeDrawerItem.iconType),
    },
    ...remainingDrawerItems,
  ];
};
