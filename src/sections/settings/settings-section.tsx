import { cn } from "src/utils";

type Props = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function SettingsSection({ title, children, className }: Props) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
