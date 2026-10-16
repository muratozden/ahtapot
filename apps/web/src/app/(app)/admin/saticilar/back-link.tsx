import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink() {
  return (
    <Link
      href="/admin/saticilar"
      className="inline-flex items-center gap-1.5 font-semibold text-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-4" strokeWidth={2} />
      Satıcılar
    </Link>
  );
}
