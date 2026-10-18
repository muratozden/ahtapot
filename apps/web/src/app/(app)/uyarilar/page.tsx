import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionIndexPage } from "@/components/section-index/section-index-page";
import { getNavGroupById } from "@/lib/section-nav";

export const metadata: Metadata = { title: "Uyarılar" };

export default function UyarilarIndexPage() {
  const group = getNavGroupById("uyarilar");
  if (!group) notFound();
  return <SectionIndexPage group={group} />;
}
