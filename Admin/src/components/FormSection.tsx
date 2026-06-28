import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Groups related form fields into a titled card. Used across the admin
// add/edit forms so every form reads the same.
export function FormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-neutral-900/50 p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
        {Icon && <Icon className="h-4 w-4 text-[#fd7e14]" />}
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
