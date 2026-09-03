import { syncAllTransactions } from "src/server/plaid";

export const maxDuration = 300;

const authorize = (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
};

export async function GET(request: Request) {
  if (!authorize(request)) return new Response("Unauthorized.", { status: 401 });

  try {
    await syncAllTransactions();
  } catch (error) {
    console.error("Cron transaction sync failed:", error);
    return new Response("Sync failed.", { status: 500 });
  }

  return new Response("OK.", { status: 200 });
}
