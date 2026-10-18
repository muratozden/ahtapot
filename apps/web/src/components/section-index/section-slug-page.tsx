import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findNavEntryByPath, getNavGroupById, sectionNavEntriesForBasePath } from "@/lib/section-nav";
import { SectionPlaceholderPage } from "./section-placeholder-page";

type SectionSlugPageProps = {
  groupId: string;
  slug: string;
};

export function sectionSlugMetadata({ groupId, slug }: SectionSlugPageProps): Metadata {
  const group = getNavGroupById(groupId);
  if (!group) return {};
  const entry = findNavEntryByPath(`${group.basePath}/${slug}`);
  if (!entry) return {};
  return { title: entry.title };
}

export function SectionSlugPage({ groupId, slug }: SectionSlugPageProps) {
  const group = getNavGroupById(groupId);
  if (!group) notFound();

  const entry = findNavEntryByPath(`${group.basePath}/${slug}`);
  if (!entry) notFound();

  return (
    <SectionPlaceholderPage entry={entry} sectionHref={group.basePath} sectionLabel={group.label} />
  );
}

export function sectionSlugStaticParams(groupId: string): { slug: string }[] {
  const group = getNavGroupById(groupId);
  if (!group) return [];

  return sectionNavEntriesForBasePath(group.basePath).map((entry) => ({
    slug: entry.href.slice(group.basePath.length + 1),
  }));
}
