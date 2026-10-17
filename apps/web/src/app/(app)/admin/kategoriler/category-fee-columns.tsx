"use client";

import { useActionState, useId } from "react";
import { type CategoryFeesFormResult, setCategoryFeesAction } from "./actions";
import { cn } from "@/lib/cn";
export type CategoryFeeValues = {
  commission: string | null;
  vat: string | null;
  marketing: string | null;
  marketplaceService: string | null;
};

type Props = {
  categoryId: number;
  initial: CategoryFeeValues;
};

const COLUMNS: { key: keyof CategoryFeeValues; formKey: string; label: string }[] = [
  { key: "commission", formKey: "commission", label: "Komisyon" },
  { key: "vat", formKey: "vat", label: "KDV" },
  { key: "marketing", formKey: "marketing", label: "Pazarlama" },
  { key: "marketplaceService", formKey: "marketplaceService", label: "Hizmet" },
];

export function CategoryFeeColumns({ categoryId, initial }: Props) {
  const action = setCategoryFeesAction.bind(null, categoryId);
  const [state, formAction, pending] = useActionState(action, undefined as CategoryFeesFormResult | undefined);
  const formId = useId();

  return (
    <>
      {COLUMNS.map((col, index) => (
        <td key={col.formKey} className="px-3 py-4 align-top">
          {index === 0 && <form id={formId} action={formAction} className="hidden" aria-hidden tabIndex={-1} />}
          <label htmlFor={`${formId}-${col.formKey}`} className="sr-only">
            {col.label}
          </label>
          <div className="relative">
            <input
              id={`${formId}-${col.formKey}`}
              form={formId}
              name={col.formKey}
              type="text"
              inputMode="decimal"
              defaultValue={initial[col.key] ?? ""}
              placeholder="—"
              disabled={pending}
              title={col.label}
              className={cn(
                "h-9 w-full min-w-[64px] rounded-lg border bg-white px-2 pr-6 text-right text-[13px] font-semibold tabular-nums text-ink outline-none",
                "border-line placeholder:font-normal placeholder:text-subtle",
                "focus:border-drop/50 focus:ring-3 focus:ring-drop/15",
                pending && "opacity-60",
              )}
              onBlur={() => {
                const form = document.getElementById(formId) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] font-bold text-muted">
              %
            </span>
          </div>
          {state?.error && col.formKey === "marketplaceService" && (
            <p role="alert" className="mt-1 text-[10px] font-medium text-rise">
              {state.error}
            </p>
          )}
        </td>
      ))}
    </>
  );
}
