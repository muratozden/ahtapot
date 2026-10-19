import type { Metadata } from "next";
import { BuyboxMockPage } from "./buybox-mock-page";

export const metadata: Metadata = { title: "Buybox takibi" };

export default function BuyboxPage() {
  return (
    <div className="pb-16">
      <BuyboxMockPage />
    </div>
  );
}
