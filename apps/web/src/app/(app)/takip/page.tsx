import type { Metadata } from "next";
import { SectionIndexPage } from "@/components/section-index/section-index-page";
import { getNavGroupById } from "@/lib/section-nav";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Takip" };

export default function TakipIndexPage() {
  const group = getNavGroupById("takip");
  if (!group) notFound();
  return <SectionIndexPage group={group} />;
}
