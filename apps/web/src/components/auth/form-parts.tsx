import { useId, type ComponentProps, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function Field({ label, hint, ...props }: { label: string; hint?: string } & ComponentProps<"input">) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[13px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-subtle hover:border-ink-soft/30 focus:border-ink-soft/50 focus:ring-4 focus:ring-ink/5"
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-rise-soft px-3.5 py-2.5 font-medium text-rise">
      {message}
    </p>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-4 focus-visible:ring-ink/10 focus-visible:outline-none disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
