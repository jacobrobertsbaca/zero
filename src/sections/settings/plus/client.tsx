"use client";

import { format } from "date-fns";
import { ArrowRight, Check, CircleCheck, Sprout } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "src/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { Spinner } from "src/components/ui/spinner";
import type { PriceLookupKey, Subscription } from "src/types/subscription/types";
import { createCheckoutSession, createPortalSession } from "src/server/actions";
import { cn } from "src/utils";
import { wrapAsync } from "src/utils/wrap-errors";
import "./plus.css";

type Plan = PriceLookupKey;

const plans: Record<Plan, { label: string; price: string; detail: string; savings?: string }> = {
  plus_monthly: { label: "Monthly", price: "$2", detail: "per month" },
  plus_yearly: { label: "Yearly", price: "$20", detail: "per year", savings: "Save 17%" },
};

const benefits = [
  "Connect up to 4 institutions",
  "Transactions sync daily",
  "Synced transactions stay yours forever",
] as const;

type Props = {
  subscription: Subscription;
};

const formatDate = (iso: string) => format(new Date(iso), "MMM d, yyyy");

const subscriptionCopy = (subscription: Subscription) => {
  if (subscription.status === "none") {
    return {
      description: (
        <>
          Sync transactions from connected accounts <span className="text-primary">automatically</span>.
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
  const [plan, setPlan] = useState<Plan>("plus_yearly");
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
        const url = await createCheckoutSession(plan);
        window.location.href = url;
      },
      () => setLoading(false)
    );
  }, [plan]);

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
        <DialogContent className="gap-0 overflow-hidden border-primary/20 p-0 sm:max-w-[420px]">
          <div className="relative overflow-hidden px-6 pb-5 pt-6">
            <DialogHeader className="relative space-y-2 text-left">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
                Upgrade to
                <span className="plus-title-gradient inline-flex items-center gap-1.5">
                  <Sprout className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
                  Plus
                </span>
              </DialogTitle>
            </DialogHeader>
          </div>

          <ul className="space-y-2 px-6 pb-5">
            {benefits.map((text) => (
              <li key={text} className="flex items-start gap-2.5">
                <CircleCheck
                  className="mt-0.5 size-3.5 shrink-0 fill-primary text-primary-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-sm leading-snug text-foreground/80">{text}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-3 px-6 pb-6">
            {(Object.keys(plans) as Plan[]).map((key) => {
              const selected = plan === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPlan(key)}
                  className={cn(
                    "group relative rounded-xl border-2 p-3 text-left transition-all duration-200",
                    selected
                      ? "border-primary/40 bg-primary/[0.06] shadow-sm ring-1 ring-primary/10"
                      : "border-border/80 bg-card hover:border-primary/25 hover:bg-muted/40"
                  )}
                >
                  {plans[key].savings && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                      {plans[key].savings}
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{plans[key].label}</p>
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        selected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/25 group-hover:border-primary/35"
                      )}
                    >
                      {selected && <Check className="size-2.5 text-white" strokeWidth={3} />}
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-end gap-1">
                    <span className="text-2xl font-semibold leading-none tracking-tight">{plans[key].price}</span>
                    <span className="pb-0.5 text-xs text-muted-foreground">{plans[key].detail}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-primary/10 bg-primary/[0.03] px-6 py-4 sm:flex-col sm:space-x-0">
            <Button
              className="w-full shadow-[0_2px_10px_-4px_hsl(var(--primary)/0.5)]"
              onClick={onUpgrade}
              disabled={loading}
            >
              {loading ? (
                <Spinner className="size-4 text-foreground" />
              ) : subscription.trialEligible ? (
                "Start trial"
              ) : (
                "Continue"
              )}
            </Button>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              {subscription.trialEligible ? "Start with 1 month free. Cancel anytime." : "Cancel anytime."}
            </DialogDescription>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
