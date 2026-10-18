import type { Metadata } from "next";
import {
  SectionSlugPage,
  sectionSlugMetadata,
  sectionSlugStaticParams,
} from "@/components/section-index/section-slug-page";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sectionSlugStaticParams("kaynaklar");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return sectionSlugMetadata({ groupId: "kaynaklar", slug });
}

export default async function KaynaklarSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return <SectionSlugPage groupId="kaynaklar" slug={slug} />;
}
