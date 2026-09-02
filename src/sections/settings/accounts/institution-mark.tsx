import { cn } from "src/utils";

export function InstitutionMark({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    return (
      <img
        src={`data:image/png;base64,${logo}`}
        alt=""
        className="size-7 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full",
        "bg-muted text-[11px] font-semibold uppercase tracking-tight text-muted-foreground"
      )}
    >
      {name.trim().charAt(0) || "?"}
    </div>
  );
}
