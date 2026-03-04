import { Redis } from '@upstash/redis';

// Upstash Redis client — uses KV_REST_API_URL + KV_REST_API_TOKEN from Vercel env
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default redis;

// ─── Key Helpers ──────────────────────────────────────────────────────────────

export const keys = {
  payment:    (id: string) => `payment:${id}`,
  receipt:    (id: string) => `receipt:${id}`,
  session:    (uid: string) => `session:${uid}`,
};

// TTL constants (seconds)
export const TTL = {
  payment: 60 * 60 * 24,      // 24 h
  receipt: 60 * 60 * 24 * 30, // 30 days
  session: 60 * 60 * 24 * 7,  // 7 days
};
