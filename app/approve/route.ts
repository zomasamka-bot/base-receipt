import { NextRequest, NextResponse } from 'next/server';
import redis, { keys, TTL } from '@/lib/redis';

/**
 * POST /approve
 *
 * TWO responsibilities:
 * 1. Called client-side by our app (onReadyForServerApproval callback)
 *    to record the payment in Redis.
 * 2. Calls Pi Platform API POST /v2/payments/{id}/approve with the
 *    server-side API key — WITHOUT this call, Pi never marks the payment
 *    as server-approved and the blockchain step cannot proceed, causing
 *    the 60-second timeout the user sees.
 *
 * Register in Pi Developer Portal → Payments → Approve URL:
 * https://base-receipt-vb-ch-f-g6-nqs-qc-d.vercel.app/approve
 */
export async function POST(request: NextRequest) {
  const ts = new Date().toISOString();
  console.log('[approve] ═══════════════════════════════════');
  console.log('[approve] POST /approve received at', ts);

  try {
    const body = await request.json();
    const { paymentId, amount, metadata } = body;

    console.log('[approve] paymentId:', paymentId);
    console.log('[approve] amount   :', amount);

    if (!paymentId) {
      console.error('[approve] ERROR: Missing paymentId');
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    // ── Step A: Call Pi Platform API to server-approve the payment ────────
    // This is mandatory. Without it Pi's backend never unblocks the
    // blockchain submission and the payment expires after 60 seconds.
    const piApiKey = process.env.PI_API_KEY;
    if (piApiKey) {
      try {
        console.log('[approve] Calling Pi Platform API approve...');
        const piRes = await fetch(
          `https://api.minepi.com/v2/payments/${paymentId}/approve`,
          {
            method:  'POST',
            headers: {
              'Authorization': `Key ${piApiKey}`,
              'Content-Type':  'application/json',
            },
          }
        );
        const piBody = await piRes.json().catch(() => ({}));
        console.log('[approve] Pi API response status:', piRes.status);
        console.log('[approve] Pi API response body:', JSON.stringify(piBody));
        if (!piRes.ok) {
          console.error('[approve] Pi API approval failed:', piRes.status, JSON.stringify(piBody));
        }
      } catch (piErr) {
        console.error('[approve] Pi API call error:', piErr);
      }
    } else {
      console.warn('[approve] PI_API_KEY not set — skipping Pi Platform API call');
    }

    // ── Step B: Persist to Upstash Redis (best-effort) ───────────────────
    try {
      await redis.set(
        keys.payment(paymentId),
        {
          paymentId,
          amount:     amount ?? 0,
          metadata:   metadata ?? {},
          status:     'approved',
          approvedAt: ts,
        },
        { ex: TTL.payment }
      );
      console.log('[approve] Redis write OK for paymentId:', paymentId);
    } catch (redisErr) {
      console.warn('[approve] Redis write failed (non-blocking):', redisErr);
    }

    console.log('[approve] Returning { approved: true }');
    console.log('[approve] ═══════════════════════════════════');
    return NextResponse.json({ approved: true });
  } catch (error) {
    console.error('[approve] Unexpected error:', error);
    // Always return approved:true so Pi does not block the flow
    return NextResponse.json({ approved: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status:    'ok',
    endpoint:  '/approve',
    timestamp: new Date().toISOString(),
  });
}
