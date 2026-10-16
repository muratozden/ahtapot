import { Logo } from "@/components/site-header/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Logo />
      <div className="mt-8 w-full max-w-[400px] rounded-2xl border border-line bg-white p-8 shadow-card">
        {children}
      </div>
    </main>
  );
}
