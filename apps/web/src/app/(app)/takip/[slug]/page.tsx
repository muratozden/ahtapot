import type { Metadata } from "next";
import {
  SectionSlugPage,
  sectionSlugMetadata,
  sectionSlugStaticParams,
} from "@/components/section-index/section-slug-page";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sectionSlugStaticParams("takip");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return sectionSlugMetadata({ groupId: "takip", slug });
}

export default async function TakipSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return <SectionSlugPage groupId="takip" slug={slug} />;
}
