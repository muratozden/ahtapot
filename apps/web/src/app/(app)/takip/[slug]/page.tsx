import type { Metadata } from "next";
import {
  SectionSlugPage,
  sectionSlugMetadata,
  sectionSlugStaticParams,
} from "@/components/section-index/section-slug-page";

type PageProps = { params: Promise<{ slug: string }> };

const TAKIP_DEDICATED_SLUGS = new Set(["urunler", "buybox"]);

export function generateStaticParams() {
  return sectionSlugStaticParams("takip").filter((p) => !TAKIP_DEDICATED_SLUGS.has(p.slug));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return sectionSlugMetadata({ groupId: "takip", slug });
}

export default async function TakipSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return <SectionSlugPage groupId="takip" slug={slug} />;
}
