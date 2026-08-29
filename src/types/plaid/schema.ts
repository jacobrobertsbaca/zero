import { z } from "zod";

export const ExchangePlaidPublicTokenSchema = z.object({
  publicToken: z.string().min(1),
});
