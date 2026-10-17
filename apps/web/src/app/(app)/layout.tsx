import { SiteHeader } from "@/components/site-header/site-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-[clamp(16px,5vw,72px)]">{children}</main>
    </>
  );
}
