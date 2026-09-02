import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { decodeProtectedHeader, importJWK, jwtVerify } from "jose";
import { isPlaidConfigured, plaid } from "src/server/plaid";
import { tags } from "src/server/tags";
import type { PlaidItemStatus } from "src/types/plaid/types";
import { supabase } from "src/utils/supabase/server";

type PlaidWebhookBody = {
  webhook_type: string;
  webhook_code: string;
  item_id?: string;
  error?: { error_code?: string } | null;
};

const verify = async (body: string, headers: Headers): Promise<boolean> => {
  try {
    const jwt = headers.get("plaid-verification");
    if (!jwt) return false;

    const header = decodeProtectedHeader(jwt);
    if (header.alg !== "ES256" || !header.kid) return false;

    const jwk = (await plaid().webhookVerificationKeyGet({ key_id: header.kid })).data.key;
    const key = await importJWK(jwk, "ES256");
    const { payload } = await jwtVerify(jwt, key, { maxTokenAge: "5 minutes" });
    if (typeof payload.request_body_sha256 !== "string") return false;

    return createHash("sha256").update(body).digest("hex") === payload.request_body_sha256;
  } catch (error) {
    console.error("Plaid webhook verification failed:", error);
    return false;
  }
};

const getItemStatus = (event: PlaidWebhookBody): PlaidItemStatus | null => {
  if (event.webhook_type !== "ITEM" || !event.item_id) return null;
  if (event.webhook_code === "LOGIN_REPAIRED") return "active";
  if (event.webhook_code === "PENDING_DISCONNECT") return "login-required";
  if (event.webhook_code === "USER_ACCOUNT_REVOKED") return "login-required";
  if (event.webhook_code === "ERROR" && event.error?.error_code === "ITEM_LOGIN_REQUIRED") {
    return "login-required";
  }
  return null;
};

export async function POST(request: Request) {
  if (!isPlaidConfigured()) return new Response("Not found.", { status: 404 });

  const body = await request.text();
  if (!(await verify(body, request.headers))) return new Response("Invalid webhook signature.", { status: 400 });

  let event: PlaidWebhookBody;
  try {
    event = JSON.parse(body) as PlaidWebhookBody;
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  const status = getItemStatus(event);
  if (!status) return new Response("OK.", { status: 200 });

  try {
    const { data } = await supabase
      .from("plaid_items")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("item_id", event.item_id)
      .neq("status", "inactive")
      .select("owner")
      .maybeSingle()
      .throwOnError();
    if (data?.owner) revalidateTag(tags.plaid(data.owner), { expire: 0 });
  } catch (error) {
    console.error("Plaid webhook handler failed:", error);
    return new Response("Webhook handler failed.", { status: 500 });
  }

  return new Response("OK.", { status: 200 });
}
