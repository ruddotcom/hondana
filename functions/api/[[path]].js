// Cloudflare Pages Functions: everything under /api/* is handled by the Worker
// in src/server/stripe.js. Bindings (DB, secrets) arrive on context.env.
import worker from "../../src/server/stripe.js";

export const onRequest = (context) => worker.fetch(context.request, context.env);
