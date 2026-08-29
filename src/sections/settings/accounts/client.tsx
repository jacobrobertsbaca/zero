"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { toast } from "sonner";
import { DeleteDialog } from "src/components/delete-dialog";
import { ConnectDialog } from "src/sections/settings/accounts/connect-dialog";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import { Separator } from "src/components/ui/separator";
import { Spinner } from "src/components/ui/spinner";
import {
  createPlaidLinkToken,
  createPlaidUpdateLinkToken,
  exchangePlaidPublicToken,
  removePlaidItem,
  syncPlaidAccounts,
} from "src/server/actions";
import type { PlaidAccount, PlaidConnection, PlaidConnections } from "src/types/plaid/types";
import type { Subscription } from "src/types/subscription/types";
import { cn } from "src/utils";
import { wrapAsync } from "src/utils/wrap-errors";

type Props = {
  connections: PlaidConnections;
  subscription: Subscription;
};

const formatSubtype = (account: PlaidAccount) => {
  const label = account.subtype ?? account.type;
  return label.replaceAll("_", " ");
};

type LinkMode = "connect" | "manage";

export function SettingsAccountsClient({ connections, subscription }: Props) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<LinkMode | null>(null);
  const [manageConnectionId, setManageConnectionId] = useState<string | null>(null);

  const count = connections.connections.length;
  const atLimit = count >= connections.limit;
  const canConnect = subscription.active && !atLimit;
  const hasConnections = count > 0;

  const resetLink = useCallback(() => {
    setToken(null);
    setRedirectUri(undefined);
    setLoading(false);
    setLinkMode(null);
    setManageConnectionId(null);
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string | null) => {
      setLoading(true);
      try {
        if (linkMode === "manage" && manageConnectionId) {
          await wrapAsync(async () => {
            const connection = await syncPlaidAccounts({ connectionId: manageConnectionId });
            toast.success(`Updated ${connection.institutionName} accounts`);
            router.refresh();
          });
        } else if (publicToken) {
          await wrapAsync(async () => {
            const connection = await exchangePlaidPublicToken({ publicToken });
            toast.success(`Connected ${connection.institutionName}`);
            router.refresh();
          });
        }
      } finally {
        resetLink();

        if (new URLSearchParams(window.location.search).has("oauth_state_id")) {
          window.history.replaceState({}, "", "/settings");
        }
      }
    },
    [linkMode, manageConnectionId, resetLink, router]
  );

  const onExit = useCallback(
    (error: { error_code?: string } | null) => {
      if (error?.error_code === "INVALID_LINK_TOKEN") {
        void wrapAsync(async () => {
          if (linkMode === "manage" && manageConnectionId) {
            setToken(await createPlaidUpdateLinkToken({ connectionId: manageConnectionId }));
          } else {
            setToken(await createPlaidLinkToken());
          }
        });
        return;
      }
      resetLink();
    },
    [linkMode, manageConnectionId, resetLink]
  );

  const onEvent = useCallback((eventName: string) => {
    if (eventName === "OPEN") setLoading(false);
  }, []);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
    onExit,
    onEvent,
    ...(redirectUri ? { receivedRedirectUri: redirectUri } : {}),
  });

  // Resume OAuth redirect — fetch token then open when ready.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("oauth_state_id")) return;

    setRedirectUri(window.location.href);
    setLoading(true);
    void wrapAsync(async () => setToken(await createPlaidLinkToken()));
  }, []);

  // Open Link once a fresh token is ready.
  useEffect(() => {
    if (!token || !ready) return;
    open();
  }, [token, ready, open]);

  const onConnect = useCallback(async () => {
    setConnectOpen(false);
    setToken(null);
    setRedirectUri(undefined);
    setLinkMode("connect");
    setManageConnectionId(null);
    setLoading(true);
    const newToken = await wrapAsync(async () => createPlaidLinkToken());
    if (newToken) {
      setToken(newToken);
    } else {
      setLoading(false);
      setLinkMode(null);
    }
  }, []);

  const onManage = useCallback(async (connectionId: string) => {
    setToken(null);
    setRedirectUri(undefined);
    setLinkMode("manage");
    setManageConnectionId(connectionId);
    setLoading(true);
    const newToken = await wrapAsync(async () => createPlaidUpdateLinkToken({ connectionId }));
    if (newToken) {
      setToken(newToken);
    } else {
      setLoading(false);
      setLinkMode(null);
      setManageConnectionId(null);
    }
  }, []);

  const onDisconnect = useCallback(async () => {
    if (!disconnectId) return;
    await wrapAsync(async () => {
      await removePlaidItem(disconnectId);
      toast.success("Institution disconnected");
      setDisconnectId(null);
      router.refresh();
    });
  }, [disconnectId, router]);

  const description = !subscription.active
    ? "Available with Plus."
    : hasConnections
      ? `${count} of ${connections.limit} institutions`
      : "Link a bank to sync transactions.";

  return (
    <>
      <Card className="animate-in fade-in">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Connected accounts</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setConnectOpen(true)}
            disabled={!canConnect || (loading && linkMode === "connect")}
          >
            {loading && linkMode === "connect" ? (
              <Spinner className="size-3.5" />
            ) : (
              <>
                <Plus className="size-3.5" />
                Connect
              </>
            )}
          </Button>
        </CardHeader>

        {hasConnections && (
          <>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border/70">
                {connections.connections.map((connection) => (
                  <ConnectionGroup
                    key={connection.id}
                    connection={connection}
                    onManage={() => onManage(connection.id)}
                    onDisconnect={() => setDisconnectId(connection.id)}
                  />
                ))}
              </ul>
            </CardContent>
          </>
        )}
      </Card>

      <ConnectDialog
        open={connectOpen}
        loading={loading && linkMode === "connect"}
        onOpenChange={setConnectOpen}
        onConfirm={onConnect}
      />

      <DeleteDialog
        open={disconnectId !== null}
        title="Disconnect institution?"
        desc="This removes the connection and stops syncing new transactions from this institution."
        onClose={() => setDisconnectId(null)}
        onDelete={onDisconnect}
      />
    </>
  );
}

function ConnectionGroup({
  connection,
  onManage,
  onDisconnect,
}: {
  connection: PlaidConnection;
  onManage: () => void;
  onDisconnect: () => void;
}) {
  const needsAttention = connection.accounts.some((account) => account.status !== "active");

  return (
    <li>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <InstitutionMark name={connection.institutionName} logo={connection.institutionLogo} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-none">{connection.institutionName}</p>
          {needsAttention && (
            <p className="mt-1 text-[11px] leading-none text-destructive">Re-authentication required</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Institution options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => onManage()}>Manage</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onDisconnect()}
            >
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ul className="divide-y divide-border/50 border-t border-border/50">
        {connection.accounts.map((account) => (
          <AccountRow key={account.id} account={account} />
        ))}
      </ul>
    </li>
  );
}

function InstitutionMark({ name, logo }: { name: string; logo: string | null }) {
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

function AccountRow({ account }: { account: PlaidAccount }) {
  return (
    <li className="flex items-center justify-between gap-4 py-2 pl-[3.25rem] pr-4 text-sm">
      <span className="min-w-0 truncate text-foreground/90">{account.name}</span>
      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="capitalize">{formatSubtype(account)}</span>
        {account.mask && (
          <span className="font-mono tabular-nums tracking-tight text-foreground/55">··{account.mask}</span>
        )}
      </span>
    </li>
  );
}
