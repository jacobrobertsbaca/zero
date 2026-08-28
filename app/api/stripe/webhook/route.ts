import { stripe, isStripeConfigured, syncSubscription } from "src/server/billing";
import type Stripe from "stripe";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return new Response("Not found.", { status: 404 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature header.", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return new Response(message, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await syncSubscription(subscription);
        break;
      }
      default:
        return new Response("Ignored.", { status: 200 });
    }
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);
    return new Response("Webhook handler failed.", { status: 500 });
  }

  return new Response("OK.", { status: 200 });
}
