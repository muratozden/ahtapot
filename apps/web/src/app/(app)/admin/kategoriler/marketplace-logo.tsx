import Image from "next/image";
import { cn } from "@/lib/cn";

const marketplaceLogos: Record<string, { src: string; width: number; height: number }> = {
  trendyol: { src: "/platform/trendyol.svg", width: 55, height: 13 },
  n11: { src: "/platform/n11.svg", width: 36, height: 12 },
  hepsiburada: { src: "/platform/hepsiburada.svg", width: 71, height: 13 },
  amazon_tr: { src: "/platform/amazon.svg", width: 68, height: 15 },
};

type Props = {
  marketplaceId: string;
  className?: string;
};

export function MarketplaceLogo({ marketplaceId, className }: Props) {
  const logo = marketplaceLogos[marketplaceId];
  if (!logo) return null;

  return (
    <Image
      src={logo.src}
      alt=""
      width={logo.width}
      height={logo.height}
      className={cn("h-[13px] w-auto shrink-0", className)}
      aria-hidden
    />
  );
}

export function hasMarketplaceLogo(marketplaceId: string): boolean {
  return marketplaceId in marketplaceLogos;
}
