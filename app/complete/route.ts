import { NextRequest, NextResponse } from 'next/server';
import redis, { keys, TTL } from '@/lib/redis';

/**
 * POST /complete
 *
 * TWO responsibilities:
 * 1. Called client-side by our app (onReadyForServerCompletion callback)
 *    to finalize the payment record and receipt in Redis.
 * 2. Calls Pi Platform API POST /v2/payments/{id}/complete with the txid
 *    and server-side API key — this closes the payment on Pi's backend.
 *    Without this call the payment remains "pending completion" indefinitely.
 *
 * Register in Pi Developer Portal → Payments → Complete URL:
 * https://base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app/complete
 */
export async function POST(request: NextRequest) {
  const ts = new Date().toISOString();
  console.log('[complete] ═══════════════════════════════════');
  console.log('[complete] POST /complete received at', ts);

  try {
    const body = await request.json();
    const { paymentId, txid, metadata } = body;

    console.log('[complete] paymentId:', paymentId);
    console.log('[complete] txid     :', txid);

    if (!paymentId) {
      console.error('[complete] ERROR: Missing paymentId');
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    // ── Step A: Call Pi Platform API to server-complete the payment ───────
    // This closes the payment on Pi's backend and prevents it from being
    // retried. txid is the blockchain transaction ID provided by Pi.
    const piApiKey = process.env.PI_API_KEY;
    if (piApiKey && txid) {
      try {
        console.log('[complete] Calling Pi Platform API complete...');
        const piRes = await fetch(
          `https://api.minepi.com/v2/payments/${paymentId}/complete`,
          {
            method:  'POST',
            headers: {
              'Authorization': `Key ${piApiKey}`,
              'Content-Type':  'application/json',
            },
            body: JSON.stringify({ txid }),
          }
        );
        const piBody = await piRes.json().catch(() => ({}));
        console.log('[complete] Pi API response status:', piRes.status);
        console.log('[complete] Pi API response body:', JSON.stringify(piBody));
        if (!piRes.ok) {
          console.error('[complete] Pi API completion failed:', piRes.status, JSON.stringify(piBody));
        }
      } catch (piErr) {
        console.error('[complete] Pi API call error:', piErr);
      }
    } else {
      if (!piApiKey) console.warn('[complete] PI_API_KEY not set — skipping Pi Platform API call');
      if (!txid)     console.warn('[complete] No txid provided — skipping Pi Platform API call');
    }

    // ── Step B: Persist to Upstash Redis (best-effort) ───────────────────
    try {
      const existing = await redis.get<Record<string, unknown>>(keys.payment(paymentId));
      const completed = {
        ...(existing ?? {}),
        paymentId,
        txid:        txid ?? null,
        metadata:    metadata ?? existing?.metadata ?? {},
        status:      'completed',
        completedAt: ts,
      };
      await redis.set(keys.payment(paymentId), completed, { ex: TTL.payment });
      console.log('[complete] Payment record updated in Redis:', paymentId);

      const receiptId = (
        (metadata?.receiptId as string | undefined) ??
        (existing?.receiptId as string | undefined)
      );
      if (receiptId) {
        await redis.set(
          keys.receipt(receiptId),
          {
            receiptId,
            referenceId: metadata?.referenceId ?? existing?.referenceId,
            paymentId,
            txid:        txid ?? null,
            status:      'submitted',
            submittedAt: ts,
          },
          { ex: TTL.receipt }
        );
        console.log('[complete] Receipt saved to Redis:', receiptId);
      }
    } catch (redisErr) {
      console.warn('[complete] Redis write failed (non-blocking):', redisErr);
    }

    console.log('[complete] Returning { completed: true }');
    console.log('[complete] ═══════════════════════════════════');
    return NextResponse.json({ completed: true });
  } catch (error) {
    console.error('[complete] Unexpected error:', error);
    return NextResponse.json({ completed: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status:    'ok',
    endpoint:  '/complete',
    timestamp: new Date().toISOString(),
  });
}
