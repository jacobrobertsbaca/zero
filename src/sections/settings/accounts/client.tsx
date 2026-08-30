"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from "react-plaid-link";
import { toast } from "sonner";
import { ConnectDialog } from "src/sections/settings/accounts/connect-dialog";
import { DisconnectInstitutionDialog } from "src/sections/settings/accounts/disconnect-institution-dialog";
import { DuplicateInstitutionDialog } from "src/sections/settings/accounts/duplicate-institution-dialog";
import { InstitutionMark } from "src/sections/settings/accounts/institution-mark";
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
import { wrapAsync } from "src/utils/wrap-errors";

type DuplicatePrompt = {
  publicToken: string;
  institutionName: string;
  connections: PlaidConnection[];
};

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
  const [disconnectConnection, setDisconnectConnection] = useState<PlaidConnection | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<LinkMode | null>(null);
  const [manageConnectionId, setManageConnectionId] = useState<string | null>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<DuplicatePrompt | null>(null);

  const count = connections.connections.length;
  const atLimit = count >= connections.limit;
  const hasConnections = count > 0;

  const description =
    subscription.active && hasConnections
      ? `${count} of ${connections.limit} institutions`
      : !subscription.active && hasConnections
      ? "Transaction syncing is paused"
      : null;

  const resetLink = useCallback(() => {
    setToken(null);
    setRedirectUri(undefined);
    setLoading(false);
    setLinkMode(null);
    setManageConnectionId(null);
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string | null, metadata: PlaidLinkOnSuccessMetadata) => {
      setLoading(true);

      if (linkMode === "manage" && manageConnectionId) {
        await wrapAsync(async () => {
          const connection = await syncPlaidAccounts({ connectionId: manageConnectionId });
          toast.success(`Updated ${connection.institutionName} accounts`);
          router.refresh();
        });
        resetLink();
        return;
      }

      if (!publicToken) {
        resetLink();
        return;
      }

      const institutionId = metadata.institution?.institution_id;
      const duplicates = institutionId
        ? connections.connections.filter((connection) => connection.institutionId === institutionId)
        : [];

      if (duplicates.length > 0) {
        setDuplicatePrompt({
          publicToken,
          institutionName: metadata.institution?.name ?? "this institution",
          connections: duplicates,
        });
        resetLink();
        return;
      }

      await wrapAsync(async () => {
        const connection = await exchangePlaidPublicToken({ publicToken });
        toast.success(`Connected ${connection.institutionName}`);
        router.refresh();
      });
      resetLink();
    },
    [connections.connections, linkMode, manageConnectionId, resetLink, router]
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

  const onEvent = useCallback(
    (eventName: string) => {
      if (eventName === "OPEN") {
        setLoading(false);
        setConnectOpen(false);
      }
    },
    [linkMode]
  );

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
    if (!disconnectConnection) return;
    await removePlaidItem(disconnectConnection.id);
    toast.success("Institution disconnected");
    router.refresh();
  }, [disconnectConnection, router]);

  const onCancelDuplicate = useCallback(() => {
    setDuplicatePrompt(null);
  }, []);

  const onConfirmDuplicate = useCallback(async () => {
    if (!duplicatePrompt) return;

    setLoading(true);
    await wrapAsync(async () => {
      const connection = await exchangePlaidPublicToken({ publicToken: duplicatePrompt.publicToken });
      toast.success(`Connected ${connection.institutionName}`);
      setDuplicatePrompt(null);
      router.refresh();
    });
    setLoading(false);
  }, [duplicatePrompt, router]);

  return (
    <>
      <Card className="animate-in fade-in">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Connected accounts</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setConnectOpen(true)}
            disabled={atLimit}
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
                    canManage={subscription.active}
                    onManage={() => onManage(connection.id)}
                    onDisconnect={() => setDisconnectConnection(connection)}
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
        subscriptionActive={subscription.active}
        onOpenChange={setConnectOpen}
        onConfirm={onConnect}
      />

      <DuplicateInstitutionDialog
        open={duplicatePrompt !== null}
        institutionName={duplicatePrompt?.institutionName ?? ""}
        connections={duplicatePrompt?.connections ?? []}
        loading={loading}
        onCancel={onCancelDuplicate}
        onConfirm={onConfirmDuplicate}
      />

      <DisconnectInstitutionDialog
        connection={disconnectConnection}
        onClose={() => setDisconnectConnection(null)}
        onDisconnect={onDisconnect}
      />
    </>
  );
}

function ConnectionGroup({
  connection,
  canManage,
  onManage,
  onDisconnect,
}: {
  connection: PlaidConnection;
  canManage: boolean;
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
            {canManage && <DropdownMenuItem onSelect={() => onManage()}>Manage</DropdownMenuItem>}
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDisconnect()}>
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

function AccountRow({ account }: { account: PlaidAccount }) {
  return (
    <li className="flex items-center justify-between gap-4 py-2 pl-[3.6rem] pr-4 text-sm">
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
