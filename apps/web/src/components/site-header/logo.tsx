import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" aria-label="Ahtapot ana sayfa" className="flex shrink-0 items-center">
      <Image src="/logo-ahtapot.svg" alt="Ahtapot" width={1069} height={266} preload className="h-7 w-auto" />
    </Link>
  );
}
