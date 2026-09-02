import { headers } from "next/headers";

/**
 * Determines the app's origin.
 * @returns The app's origin URL (e.g. `https://example.com`)
 */
export const getAppOrigin = async () => {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("Could not determine app URL from request headers.");
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
};
