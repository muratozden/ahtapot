import { ArrowRight, type LucideIcon } from "lucide-react";
import { navGroups, type NavGroup } from "@/components/site-header/nav-config";

export type SectionNavEntry = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

function sideLinkToEntry(link: { title: string; href: string }): SectionNavEntry {
  return {
    href: link.href,
    title: link.title,
    description: "",
    icon: ArrowRight,
  };
}

export function getNavGroupById(id: string): NavGroup | undefined {
  return navGroups.find((g) => g.id === id);
}

const allEntries: SectionNavEntry[] = navGroups.flatMap((group) => {
  const main = group.items.map((item) => ({
    href: item.href,
    title: item.title,
    description: item.description,
    icon: item.icon,
  }));
  const side = (group.sideLinks ?? []).map(sideLinkToEntry);
  return [...main, ...side];
});

export function findNavEntryByPath(pathname: string): SectionNavEntry | undefined {
  return allEntries.find((e) => e.href === pathname);
}

/** All nav hrefs under a section prefix (includes side links from other groups). */
export function sectionNavEntriesForBasePath(basePath: string): SectionNavEntry[] {
  const prefix = `${basePath}/`;
  return allEntries.filter((e) => e.href.startsWith(prefix));
}
