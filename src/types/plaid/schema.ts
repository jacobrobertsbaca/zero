import { z } from "zod";

export const ExchangePlaidPublicTokenSchema = z.object({
  publicToken: z.string().min(1),
});

export const SyncPlaidAccountsSchema = z.object({
  connectionId: z.string().uuid(),
});

export const CreatePlaidUpdateLinkTokenSchema = z.object({
  connectionId: z.string().uuid(),
});
