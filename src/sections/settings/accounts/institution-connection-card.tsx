import { format } from "date-fns";
import { InstitutionMark } from "src/sections/settings/accounts/institution-mark";

type Props = {
  institutionName: string;
  institutionLogo: string | null;
  createdAt: string;
  accountCount: number;
};

const formatConnectedDate = (iso: string) => format(new Date(iso), "MM/dd/yyyy");

export function InstitutionConnectionCard({
  institutionName,
  institutionLogo,
  createdAt,
  accountCount,
}: Props) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-input bg-card px-3 py-2.5">
      <InstitutionMark name={institutionName} logo={institutionLogo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-none">{institutionName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Connected {formatConnectedDate(createdAt)}
          {accountCount > 0 && (
            <>
              {" · "}
              {accountCount} {accountCount === 1 ? "account" : "accounts"}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
