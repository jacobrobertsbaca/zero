"use client";

import dynamic from "next/dynamic";
import { format } from "date-fns";
import useSWR from "swr";
import { Card } from "src/components/ui/card";
import { getPlaidConnections } from "src/server/actions";
import type { PlaidConnection } from "src/types/plaid/types";
import { SyncDetails } from "src/types/transaction/types";
import { asDate } from "src/types/utils/methods";
import { DateString } from "src/types/utils/types";

const TransactionLocationMap = dynamic(
  () => import("./transaction-map").then((module) => module.TransactionLocationMap),
  { ssr: false }
);

type TransactionSyncDetailsProps = {
  details: SyncDetails;
  fallbackDate: DateString;
};

type SyncDetailRowProps = {
  label: string;
  children: React.ReactNode;
};

const MARK_CLASS = "block size-4 shrink-0 rounded object-cover";

const SyncDetailRow = ({ label, children }: SyncDetailRowProps) => (
  <div className="flex h-8 items-center justify-between gap-2 px-2">
    <span className="shrink-0 leading-none text-muted-foreground">{label}</span>
    <div className="flex min-w-0 items-center justify-end leading-none">{children}</div>
  </div>
);

const SyncDetailMark = ({ logo, logoUrl }: { logo?: string | null; logoUrl?: string }) => {
  if (logoUrl) {
    return <img src={logoUrl} alt="" className={MARK_CLASS} />;
  }

  if (logo) {
    return <img src={`data:image/png;base64,${logo}`} alt="" className={MARK_CLASS} />;
  }

  return null;
};

const formatLocation = (location: SyncDetails["location"]) => {
  const parts = [location.city, location.region].filter(Boolean);
  return parts.join(", ") || location.address;
};

const formatDatetime = (details: SyncDetails, fallbackDate: DateString) => {
  if (details.datetime) return format(new Date(details.datetime), "EEEE, MMMM d, yyyy 'at' h:mm a");
  return format(asDate(fallbackDate), "EEEE, MMMM d, yyyy");
};

const formatStatus = (status: SyncDetails["status"]) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "posted":
      return "Posted";
    case "removed":
      return "Removed";
  }
};

const findPlaidAccount = (connections: readonly PlaidConnection[], accountId: string) => {
  for (const connection of connections) {
    const account = connection.accounts.find((item) => item.id === accountId);
    if (account) return { account, connection };
  }
};

export const TransactionSyncDetails = ({ details, fallbackDate }: TransactionSyncDetailsProps) => {
  const { data: plaid } = useSWR("plaid/connections", () => getPlaidConnections());
  const account = plaid ? findPlaidAccount(plaid.connections, details.account_id) : undefined;
  const location = formatLocation(details.location);

  const rows: { key: string; content: React.ReactNode }[] = [];

  if (details.merchant) {
    rows.push({
      key: "merchant",
      content: (
        <SyncDetailRow label="Merchant">
          <span className="flex min-w-0 items-center justify-end gap-1.5">
            <SyncDetailMark logoUrl={details.merchant.logo_url} />
            <span className="truncate">{details.merchant.name}</span>
          </span>
        </SyncDetailRow>
      ),
    });
  }

  if (location) {
    rows.push({
      key: "location",
      content: (
        <SyncDetailRow label="Location">
          <span className="truncate">{location}</span>
        </SyncDetailRow>
      ),
    });
  }

  rows.push({
    key: "date",
    content: (
      <SyncDetailRow label="Date">
        <span>{formatDatetime(details, fallbackDate)}</span>
      </SyncDetailRow>
    ),
  });

  rows.push({
    key: "account",
    content: (
      <SyncDetailRow label="Account">
        {account ? (
          <span className="flex min-w-0 items-center justify-end gap-1.5">
            <SyncDetailMark logo={account.connection.institutionLogo} />
            <span className="flex min-w-0 items-center justify-end gap-1 truncate capitalize">
              <span className="truncate">
                {account.connection.institutionName} {account.account.type.replaceAll("_", " ")}
              </span>
              {account.account.mask ? (
                <span className="shrink-0 font-mono tabular-nums tracking-tight ">··{account.account.mask}</span>
              ) : null}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">{plaid ? "Unknown account" : "Loading..."}</span>
        )}
      </SyncDetailRow>
    ),
  });

  rows.push({
    key: "status",
    content: (
      <SyncDetailRow label="Status">
        <span>{formatStatus(details.status)}</span>
      </SyncDetailRow>
    ),
  });

  return (
    <Card className="overflow-hidden text-xs leading-none">
      <div>
        {rows.map((row, index) => (
          <div key={row.key}>
            {row.content}
            {index < rows.length - 1 ? <div className="mx-2 border-b border-border" /> : null}
          </div>
        ))}
      </div>
      {details.location.coords ? (
        <TransactionLocationMap lat={details.location.coords.lat} lng={details.location.coords.lng} />
      ) : null}
    </Card>
  );
};
