import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/** Lazily construct the Stripe client so builds succeed without keys. */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Add it to your environment (see .env.example).",
      );
    }
    stripeClient = new Stripe(key, { typescript: true });
  }
  return stripeClient;
}
