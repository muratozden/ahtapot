import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionIndexPage } from "@/components/section-index/section-index-page";
import { getNavGroupById } from "@/lib/section-nav";

export const metadata: Metadata = { title: "Analiz" };

export default function AnalizIndexPage() {
  const group = getNavGroupById("analiz");
  if (!group) notFound();
  return <SectionIndexPage group={group} />;
}
