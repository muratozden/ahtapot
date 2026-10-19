import type { Metadata } from "next";
import { CostEntryMockPage } from "./cost-entry-mock-page";

export const metadata: Metadata = { title: "Ürün maliyet girişi" };

export default function MaliyetPage() {
  return (
    <div className="pb-16">
      <CostEntryMockPage />
    </div>
  );
}
