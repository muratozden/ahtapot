import { SiteHeader } from "@/components/site-header/site-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pt-6 pb-10 sm:px-6 xl:px-8">{children}</main>
    </>
  );
}
