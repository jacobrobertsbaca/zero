"use client";

import { format } from "date-fns";
import { ArrowRight, Heart, Infinity, Landmark, RefreshCw, Sprout, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "src/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { Spinner } from "src/components/ui/spinner";
import type { Subscription } from "src/types/subscription/types";
import { createCheckoutSession, createPortalSession } from "src/server/actions";
import { cn } from "src/utils";
import { wrapAsync } from "src/utils/wrap-errors";
import "./plus.css";

const benefits: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: Landmark,
    title: "Connect up to 4 institutions.",
    detail: "Securely link banks and cards with Plaid to import activity.",
  },
  {
    icon: RefreshCw,
    title: "Transactions sync daily.",
    detail: "Purchases and transfers show up automatically and can be renamed, edited, and deleted.",
  },
  {
    icon: Infinity,
    title: "Synced transactions stay yours forever.",
    detail: "Cancel or disconnect without losing any of your data.",
  },
  {
    icon: Heart,
    title: "As cheap as we could make it.",
    detail: "Budgeting should save you money. Everything else stays free forever.",
  },
];

type Props = {
  subscription: Subscription;
};

const formatDate = (iso: string) => format(new Date(iso), "MMM d, yyyy");

const subscriptionCopy = (subscription: Subscription) => {
  if (subscription.status === "none") {
    return {
      description: (
        <>
          Sync transactions from connected accounts <span className="text-primary">automatically</span>
        </>
      ),
      action: "upgrade" as const,
      actionLabel: "Upgrade",
    };
  }

  const date = formatDate(subscription.periodEnd!);

  if (subscription.status === "trial") {
    return {
      badge: "Trial",
      description: (
        <>
          You&apos;ll be charged on <span className="font-semibold">{date}</span>. Cancel anytime.
        </>
      ),
      action: "manage" as const,
      actionLabel: "Manage",
    };
  }

  if (subscription.status === "past_due") {
    return {
      badge: "Issue",
      description: <>An issue occurred with your payment method. Update your information to keep using Plus.</>,
      action: "manage" as const,
      actionLabel: "Fix",
    };
  }

  if (subscription.status === "active_cancelled") {
    return {
      badge: "Cancelled",
      description: (
        <>
          Subscription ends <span className="font-semibold">{date}</span>. Renew anytime.
        </>
      ),
      action: "manage" as const,
      actionLabel: "Manage",
    };
  }

  return {
    description: (
      <>
        Subscription renews on <span className="font-semibold">{date}</span>. Cancel anytime.
      </>
    ),
    action: "manage" as const,
    actionLabel: "Manage",
  };
};

export function SettingsPlusClient({ subscription }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { badge, description, action, actionLabel } = subscriptionCopy(subscription);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    toast.success("Welcome to Plus!");
    window.history.replaceState({}, "", "/settings");
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);

  const onManage = useCallback(async () => {
    setLoading(true);
    await wrapAsync(
      async () => {
        const url = await createPortalSession();
        window.location.href = url;
      },
      () => setLoading(false)
    );
  }, []);

  const onUpgrade = useCallback(async () => {
    setLoading(true);
    await wrapAsync(
      async () => {
        const url = await createCheckoutSession();
        window.location.href = url;
      },
      () => setLoading(false)
    );
  }, []);

  const isUpgrade = action === "upgrade";

  return (
    <>
      <Card
        className={cn(
          "animate-in fade-in border-primary/25 bg-primary/[0.04]",
          isUpgrade &&
            "border-primary/35 bg-gradient-to-br from-primary/[0.12] via-primary/[0.05] to-transparent shadow-sm",
          subscription.active && "from-primary/[0.08] via-primary/[0.04]"
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 py-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <Sprout className="size-4 shrink-0" />
              Plus
              {badge && (
                <span className="rounded-full bg-primary/15 py-1 px-2 text-[11px] font-medium leading-none text-primary">
                  {badge}
                </span>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action === "manage" ? (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={onManage}
              disabled={loading}
            >
              {loading ? (
                <Spinner className="size-3.5" />
              ) : (
                <>
                  {actionLabel}
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          ) : (
            <Button size="sm" className="shrink-0 shadow-sm" onClick={openModal}>
              {actionLabel}
              <ArrowRight className="size-3.5" />
            </Button>
          )}
        </CardHeader>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex flex-wrap items-center gap-2 font-semibold tracking-tight">
              Upgrade to
              <span className="plus-title-gradient inline-flex items-center gap-1.5">
                <Sprout className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
                Plus
              </span>
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="gap-2 pb-3">
            <ul className="overflow-hidden rounded-sm border border-border/60 bg-gradient-to-b from-muted/35 to-muted/10">
              {benefits.map(({ icon: Icon, title, detail }, index) => (
                <li
                  key={title}
                  className={cn("flex items-center gap-3 px-3 py-3", index > 0 && "border-t border-border/50")}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted border">
                    <Icon className="size-3 text-foreground" strokeWidth={1.75} />
                  </span>
                  <span className="text-xs leading-snug text-foreground/85">
                    <span className="font-medium text-foreground">{title}</span> {detail}
                  </span>
                </li>
              ))}
            </ul>
          </DialogBody>

          <DialogFooter className="flex-col gap-2 sm:flex-col border-0 pt-0">
            <Button className="w-full" variant="outline" onClick={onUpgrade} disabled={loading}>
              {loading ? (
                <Spinner className="size-4 text-foreground" />
              ) : subscription.trialEligible ? (
                "Start trial"
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
