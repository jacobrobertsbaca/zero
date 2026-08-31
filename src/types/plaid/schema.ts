import { z } from "zod";

export const ExchangePlaidPublicTokenSchema = z.object({
  publicToken: z.string().min(1),
  /** Set to revive an existing inactive connection instead of creating a new one. */
  connectionId: z.string().uuid().optional(),
});

export const SyncPlaidAccountsSchema = z.object({
  connectionId: z.string().uuid(),
});

export const CreatePlaidUpdateLinkTokenSchema = z.object({
  connectionId: z.string().uuid(),
});
