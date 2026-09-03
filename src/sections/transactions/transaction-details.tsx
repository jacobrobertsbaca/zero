"use client";

import dynamic from "next/dynamic";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Card } from "src/components/ui/card";
import { getPlaidConnections } from "src/server/actions";
import type { PlaidConnection } from "src/types/plaid/types";
import { SyncDetails } from "src/types/transaction/types";
import { asDate } from "src/types/utils/methods";
import { DateString } from "src/types/utils/types";
import { cn } from "src/utils";

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

const SyncDetailRow = ({ label, children }: SyncDetailRowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setFade({
        left: scrollLeft > 1,
        right: scrollLeft + clientWidth < scrollWidth - 1,
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [children]);

  return (
    <div className="flex h-8 items-center gap-12 px-2">
      <span className="shrink-0 leading-none text-muted-foreground">{label}</span>
      <div
        ref={ref}
        className={cn(
          "min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain py-px -my-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          fade.left &&
            fade.right &&
            "[mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]",
          fade.left && !fade.right && "[mask-image:linear-gradient(to_right,transparent,black_12px,black_100%)]",
          !fade.left && fade.right && "[mask-image:linear-gradient(to_right,black,black_calc(100%-12px),transparent)]"
        )}
      >
        <div className="flex w-max min-w-full items-center justify-end gap-1.5 whitespace-nowrap leading-none">
          {children}
        </div>
      </div>
    </div>
  );
};

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

const formatAccountKind = (account: { type: string; subtype: string | null }) => {
  const label = (account.subtype ?? account.type).replaceAll("_", " ");
  if (label.toLowerCase() === "credit card") return "Credit";
  return label;
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
          <SyncDetailMark logoUrl={details.merchant.logo_url} />
          <span>{details.merchant.name}</span>
        </SyncDetailRow>
      ),
    });
  }

  rows.push({
    key: "name",
    content: (
      <SyncDetailRow label="Name">
        <span>{details.original_name}</span>
      </SyncDetailRow>
    ),
  });

  if (location) {
    rows.push({
      key: "location",
      content: (
        <SyncDetailRow label="Location">
          <span>{location}</span>
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
          <>
            <SyncDetailMark logo={account.connection.institutionLogo} />
            <span className="capitalize">
              {account.connection.institutionName} {formatAccountKind(account.account)}
            </span>
            {account.account.mask ? (
              <span className="font-mono tabular-nums tracking-tight">··{account.account.mask}</span>
            ) : null}
          </>
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
