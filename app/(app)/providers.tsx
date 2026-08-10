"use client";

import { AuthProvider } from "src/contexts/auth-context";
import { TooltipProvider } from "src/components/ui/tooltip";
import { toast } from "sonner";
import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <SWRConfig
          value={{
            onError(err) {
              if (err) console.error(err);
              toast.error(err?.message ?? "An error occurred");
            },
            revalidateOnFocus: false,
          }}
        >
          {children}
        </SWRConfig>
      </TooltipProvider>
    </AuthProvider>
  );
}
