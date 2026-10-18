import type { Metadata } from "next";
import {
  SectionSlugPage,
  sectionSlugMetadata,
  sectionSlugStaticParams,
} from "@/components/section-index/section-slug-page";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sectionSlugStaticParams("uyarilar");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return sectionSlugMetadata({ groupId: "uyarilar", slug });
}

export default async function UyarilarSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return <SectionSlugPage groupId="uyarilar" slug={slug} />;
}
