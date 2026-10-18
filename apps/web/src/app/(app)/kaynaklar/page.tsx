import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionIndexPage } from "@/components/section-index/section-index-page";
import { getNavGroupById } from "@/lib/section-nav";

export const metadata: Metadata = { title: "Kaynaklar" };

export default function KaynaklarIndexPage() {
  const group = getNavGroupById("kaynaklar");
  if (!group) notFound();
  return <SectionIndexPage group={group} />;
}
